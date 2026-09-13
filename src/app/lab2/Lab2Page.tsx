"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { GitHubLink } from "@/components/GitHubLink";
import {
  Lab2CurvesChart,
  type CurveChartSeries,
} from "@/components/Lab2CurvesChart";
import { Lab2CircuitDiagram } from "@/components/Lab2CircuitDiagram";
import { Lab2Diagram } from "@/components/Lab2Diagram";
import { Lab2ErrorChart } from "@/components/Lab2ErrorChart";
import {
  Lab2ErrorScatterChart,
  type Mu0ScatterPoint,
} from "@/components/Lab2ErrorScatterChart";
import {
  LabTimeChart,
  type ChartMarker,
  type ChartSeries,
} from "@/components/LabTimeChart";
import { LabXYChart, type XYFitLine } from "@/components/LabXYChart";
import { ProjectCredits } from "@/components/ProjectCredits";
import { useLanguage } from "@/contexts/LanguageContext";

import { curveSeries, summarizeCurves } from "@/lib/lab2Curves";
import {
  analyzeStep,
  STEP_DT_S,
  stepCurrentA,
  stepForceMn,
} from "@/lib/lab2Step";
import { propagatePointMu0Error } from "@/lib/lab2ErrorPropagation";
import {
  CURRENT_ERROR_A,
  deltaFromAcceptedPct,
  dominantCrossoverA,
  errorTerms,
  FORCE_ERROR_MN,
  geometryFactor,
  LENGTH_ERROR_M,
  LOWER_DIAMETER_M,
  LOWER_LENGTH_M,
  MU0_ACCEPTED,
  SEPARATION_ERROR_M,
  SEPARATION_M,
  UPPER_DIAMETER_M,
  UPPER_LENGTH_M,
  UPPER_LOOP_HEIGHT_M,
} from "@/lib/lab2Geometry";
import { analyzeRamp, rampCurrentA, rampForceMn } from "@/lib/lab2Ramp";

import { LAB2_COPY } from "./copy";

const CARD =
  "rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900";
const SECTION = `${CARD} flex flex-col gap-2`;
const H2 = "text-base font-semibold text-zinc-900 dark:text-zinc-100";
const H3 = "pt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200";
const BODY = "text-sm leading-relaxed text-zinc-600 dark:text-zinc-300";
const TD = "border-t border-zinc-200 px-2 py-1 dark:border-zinc-700";
const TH = "px-2 py-1 text-left font-medium";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-950">
      <div className="text-[11px] leading-tight text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      <div className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
        {value}
      </div>
    </div>
  );
}

/** μ₀ in the 1.234·10⁻⁶ form the guide quotes it in. */
function formatMu0(hPerM: number): string {
  return `${(hPerM * 1e6).toFixed(4)}·10⁻⁶`;
}

function signedPct(value: number, digits = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;
}

interface ErrorTableRow {
  run: string;
  n: number;
  currentA: number;
  forceMn: number;
  mu0HPerM: number;
  errorHPerM: number;
  upperHPerM: number;
  lowerHPerM: number;
  errorPct: number;
  containsReference: boolean;
}

function summarizeErrorRows(rows: ErrorTableRow[]) {
  const n = Math.max(1, rows.length);
  const meanMu0HPerM = rows.reduce((s, r) => s + r.mu0HPerM, 0) / n;
  const meanErrorHPerM = rows.reduce((s, r) => s + r.errorHPerM, 0) / n;
  const variance =
    rows.reduce((s, r) => s + (r.mu0HPerM - meanMu0HPerM) ** 2, 0) /
    Math.max(1, rows.length - 1);
  return { meanMu0HPerM, meanErrorHPerM, spreadHPerM: Math.sqrt(variance) };
}

function toMicroPoints(rows: ErrorTableRow[]): Mu0ScatterPoint[] {
  return rows.map((r) => ({
    currentA: r.currentA,
    mu0Micro: r.mu0HPerM * 1e6,
    errorMicro: r.errorHPerM * 1e6,
  }));
}

export function Lab2Page() {
  const { language, toggle } = useLanguage();
  const c = LAB2_COPY[language];
  const [showMarkers, setShowMarkers] = useState(true);
  const [linearize, setLinearize] = useState(false);
  const [errorRun, setErrorRun] = useState<string>("all");
  const [rampErrorBranch, setRampErrorBranch] = useState<string>("all");

  const step = useMemo(() => analyzeStep(), []);
  const ramp = useMemo(() => analyzeRamp(), []);
  const curves = useMemo(() => summarizeCurves(), []);
  const factor = useMemo(() => geometryFactor(), []);

  const stepSeries = useMemo<ChartSeries[]>(
    () => [
      {
        values: stepForceMn,
        axis: "left",
        label: c.chartForce,
        color: "force",
      },
      {
        values: stepCurrentA,
        axis: "right",
        label: c.chartCurrent,
        color: "current",
      },
    ],
    [c.chartForce, c.chartCurrent],
  );

  const stepMarkers = useMemo<ChartMarker[]>(
    () => [
      { timeS: step.currentSettledS, label: c.markerCurrent, faint: true },
      { timeS: step.t10S, label: c.markerT10, faint: true },
      { timeS: step.t90S, label: c.markerT90 },
      { timeS: step.peakTimeS, label: c.markerPeak },
      { timeS: step.settlingTimeS, label: c.markerSettle },
    ],
    [step, c],
  );

  const chartSeries = useMemo<CurveChartSeries[]>(
    () =>
      curveSeries.map((s, i) => ({
        label: s.label,
        currentA: s.currentA,
        forceMn: s.forceMn,
        slopeMnPerA2: curves.fits[i]?.slopeMnPerA2 ?? 0,
        interceptMn: curves.fits[i]?.interceptMn ?? 0,
      })),
    [curves],
  );

  // Per-point μ₀ error propagation (§2.2 budget) over every clean point of
  // the three stepped runs — this is what lets the accepted μ₀ be checked
  // against each point's own band, not just against the fitted slope.
  const errorTable = useMemo(() => {
    const rows: ErrorTableRow[] = [];
    curveSeries.forEach((s) => {
      s.currentA.forEach((currentA, k) => {
        if (Math.abs(currentA) < 0.5) return;
        const forceMn = s.forceMn[k] ?? 0;
        const p = propagatePointMu0Error(currentA, forceMn, MU0_ACCEPTED);
        rows.push({ run: s.label, n: k + 1, ...p });
      });
    });
    return { rows, ...summarizeErrorRows(rows) };
  }, []);

  const errorRunOptions = useMemo(
    () => ["all", ...curveSeries.map((s) => s.label)],
    [],
  );

  // Same rows, narrowed to one run (or "all") via the selector below the
  // chart — this is what makes it quick to find a single run's own points
  // and re-check its own μ₀ₘ/Δμ₀ₘ against the pooled one above.
  const filteredErrorTable = useMemo(() => {
    const rows =
      errorRun === "all"
        ? errorTable.rows
        : errorTable.rows.filter((r) => r.run === errorRun);
    return { rows, ...summarizeErrorRows(rows) };
  }, [errorRun, errorTable.rows]);

  // Same per-point Δμ₀ propagation, applied to every raw sample of the
  // continuous sweep instead of the discrete steps — "run" here is really
  // the branch (rising/falling) so the chart can reuse the same
  // rising/falling filter language as the hysteresis discussion above it.
  const rampErrorTable = useMemo(() => {
    const rows: ErrorTableRow[] = [];
    for (let k = 0; k < rampCurrentA.length; k++) {
      const currentA = rampCurrentA[k] ?? 0;
      if (Math.abs(currentA) < 0.5) continue;
      const forceMn = rampForceMn[k] ?? 0;
      const p = propagatePointMu0Error(currentA, forceMn, MU0_ACCEPTED);
      rows.push({
        run: k <= ramp.peakIndex ? "rising" : "falling",
        n: k,
        ...p,
      });
    }
    return { rows, ...summarizeErrorRows(rows) };
  }, [ramp.peakIndex]);

  const filteredRampErrorTable = useMemo(() => {
    const rows =
      rampErrorBranch === "all"
        ? rampErrorTable.rows
        : rampErrorTable.rows.filter((r) => r.run === rampErrorBranch);
    return { rows, ...summarizeErrorRows(rows) };
  }, [rampErrorBranch, rampErrorTable.rows]);

  // The hysteresis loop is plotted against I² rather than I so that the three
  // fits stay straight lines on the same axes — the same linearisation the
  // stepped runs use, and the only form LabXYChart can draw.
  const rampCurrentSquared = useMemo(
    () => Float64Array.from(rampCurrentA, (i) => i * i),
    [],
  );

  const rampFits = useMemo<XYFitLine[]>(
    () => [
      {
        slope: ramp.overall.slopeMnPerA2,
        intercept: ramp.overall.interceptMn,
        tone: "overall",
        label: c.rampOverallFit,
      },
      {
        slope: ramp.rising.slopeMnPerA2,
        intercept: ramp.rising.interceptMn,
        tone: "rising",
        label: c.rampRisingFit,
      },
      {
        slope: ramp.falling.slopeMnPerA2,
        intercept: ramp.falling.interceptMn,
        tone: "falling",
        label: c.rampFallingFit,
      },
    ],
    [ramp, c.rampOverallFit, c.rampRisingFit, c.rampFallingFit],
  );

  const geometryValues = useMemo(
    () => [
      `${(LOWER_LENGTH_M * 1000).toFixed(0)} ± ${(LENGTH_ERROR_M * 1000).toFixed(0)} mm`,
      `${(UPPER_LENGTH_M * 1000).toFixed(0)} ± ${(LENGTH_ERROR_M * 1000).toFixed(0)} mm`,
      `${(LOWER_DIAMETER_M * 1000).toFixed(3)} mm`,
      `${(UPPER_DIAMETER_M * 1000).toFixed(3)} mm`,
      `${(SEPARATION_M * 1000).toFixed(2)} ± ${(SEPARATION_ERROR_M * 1000).toFixed(2)} mm`,
      `${(UPPER_LOOP_HEIGHT_M * 1000).toFixed(1)} mm`,
    ],
    [],
  );

  // The three routes to μ₀, each with and without the loop correction.
  const routes = useMemo(
    () => [
      {
        label: c.routeCurves,
        ideal: curves.meanMu0IdealHPerM,
        corrected: curves.meanMu0CorrectedHPerM,
      },
      {
        label: c.routeRamp,
        ideal: ramp.mu0IdealHPerM,
        corrected: ramp.mu0CorrectedHPerM,
      },
      {
        label: c.routeStep,
        ideal: step.mu0IdealHPerM,
        corrected: step.mu0CorrectedHPerM,
      },
    ],
    [c.routeCurves, c.routeRamp, c.routeStep, curves, ramp, step],
  );

  const meanIdeal = routes.reduce((s, r) => s + r.ideal, 0) / routes.length;
  const meanCorrected =
    routes.reduce((s, r) => s + r.corrected, 0) / routes.length;

  // The reported error: the guide's §2.2 budget evaluated where the curve is
  // strongest, which is where the fitted slope is actually pinned down.
  const budget = useMemo(
    () => errorTerms(step.currentSteadyA, step.forceSteadyMn),
    [step],
  );

  const worstR2 = Math.min(...curves.fits.map((f) => f.r2));
  const crossoverA = dominantCrossoverA(
    curves.meanSlopeMnPerA2,
    step.currentSteadyA,
  );

  const impliedMm = useMemo(() => {
    const values = curves.impliedSeparationM;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    return mean * 1000;
  }, [curves]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-3 p-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {c.title}
          </h1>
          <div className="flex items-center gap-2">
            <GitHubLink />
            <button
              type="button"
              onClick={toggle}
              className="shrink-0 rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {language === "es" ? "EN" : "ES"}
            </button>
          </div>
        </div>
        <p className={BODY}>{c.subtitle}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{c.source}</p>
        <div className="flex flex-col gap-1">
          <Link
            href="/lab1"
            className="text-xs text-blue-700 hover:underline dark:text-blue-400"
          >
            {c.backToLab1}
          </Link>
          <Link
            href="/"
            className="text-xs text-blue-700 hover:underline dark:text-blue-400"
          >
            {c.backToSim}
          </Link>
        </div>
      </header>

      {/* 1 — goal and expressions */}
      <section className={SECTION}>
        <h2 className={H2}>{c.goalTitle}</h2>
        <p className={BODY}>{c.goalBody}</p>
        <p className="text-center font-mono text-base text-zinc-900 dark:text-zinc-100">
          {c.formula}
        </p>
        <p className="text-center font-mono text-base text-zinc-900 dark:text-zinc-100">
          {c.formulaInverted}
        </p>
        <p className={BODY}>{c.formulaNote}</p>
        <p className="overflow-x-auto text-center font-mono text-xs text-zinc-700 dark:text-zinc-200">
          {c.errorFormula}
        </p>
        <p className="text-center font-mono text-sm text-zinc-700 dark:text-zinc-200">
          {c.errorFormulaRelative}
        </p>
        <p className={BODY}>{c.errorNote}</p>
      </section>

      {/* 2 — setup */}
      <section className={SECTION}>
        <h2 className={H2}>{c.setupTitle}</h2>
        <ol className={`${BODY} list-decimal pl-5`}>
          {c.setupSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          {c.setupWarning}
        </p>
      </section>

      {/* 3 — geometry */}
      <section className={SECTION}>
        <h2 className={H2}>{c.geometryTitle}</h2>
        <p className={BODY}>{c.geometryBody}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-zinc-600 dark:text-zinc-300">
            <caption className="pb-1 text-left text-xs text-zinc-500 dark:text-zinc-400">
              {c.geometryTableCaption}
            </caption>
            <thead className="text-zinc-800 dark:text-zinc-100">
              <tr>
                <th className={TH}>{c.geometryColQuantity}</th>
                <th className={TH}>{c.geometryColValue}</th>
                <th className={TH}>{c.geometryColHow}</th>
              </tr>
            </thead>
            <tbody>
              {c.geometryRows.map((row, i) => (
                <tr key={row.quantity}>
                  <td className={TD}>{row.quantity}</td>
                  <td className={`${TD} font-mono whitespace-nowrap`}>
                    {geometryValues[i]}
                  </td>
                  <td className={TD}>{row.how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={BODY}>{c.geometryDiagramBody}</p>
        <Lab2Diagram labels={c.diagram} />
        <p className={BODY}>{c.geometryDiagramNote}</p>
      </section>

      {/* 4 — the bench, wired and running */}
      <section className={SECTION}>
        <h2 className={H2}>{c.circuitTitle}</h2>
        <p className={BODY}>{c.circuitBody}</p>
        <Lab2CircuitDiagram
          labels={c.circuit}
          slopeMnPerA2={curves.meanSlopeMnPerA2}
          referenceForceMn={step.forceSteadyMn}
        />
        <p className={BODY}>{c.circuitNote}</p>
      </section>

      {/* 5 — step response */}
      <section className={SECTION}>
        <h2 className={H2}>{c.stepTitle}</h2>
        <p className={BODY}>{c.stepBody}</p>
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={showMarkers}
            onChange={(e) => setShowMarkers(e.target.checked)}
          />
          {c.markersToggle}
        </label>
        <LabTimeChart
          series={stepSeries}
          leftLabel={c.chartForce}
          rightLabel={c.chartCurrent}
          markers={stepMarkers}
          band={{
            axis: "left",
            from: step.forceSteadyMn * 0.98,
            to: step.forceSteadyMn * 1.02,
            label: c.bandLabel,
          }}
          showMarkers={showMarkers}
          timeLabel={c.chartTime}
          hoverHint={c.hoverHint}
          dtS={STEP_DT_S}
        />
        <p className={BODY}>{c.stepReadNote}</p>
        <h3 className={H3}>{c.stepMetricsTitle}</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric
            label={c.mForceSteady}
            value={`${step.forceSteadyMn.toFixed(2)} mN`}
          />
          <Metric
            label={c.mCurrentSteady}
            value={`${step.currentSteadyA.toFixed(2)} A`}
          />
          <Metric
            label={c.mCurrentSettled}
            value={`${(step.currentSettledS * 1000).toFixed(0)} ms`}
          />
          <Metric
            label={c.mRise}
            value={`${(step.riseTimeS * 1000).toFixed(0)} ms`}
          />
          <Metric
            label={c.mOvershoot}
            value={`${step.overshootPct.toFixed(1)} %`}
          />
          <Metric
            label={c.mSettle}
            value={`${(step.settlingTimeS * 1000).toFixed(0)} ms`}
          />
          <Metric label={c.mZeta} value={step.zeta.toFixed(2)} />
          <Metric
            label={c.mNatFreq}
            value={`${step.naturalFreqHz.toFixed(2)} Hz`}
          />
        </div>
      </section>

      {/* 6 — the three stepped runs */}
      <section className={SECTION}>
        <h2 className={H2}>{c.curvesTitle}</h2>
        <p className={BODY}>{c.curvesBody}</p>
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={linearize}
            onChange={(e) => setLinearize(e.target.checked)}
          />
          {c.linearizeToggle}
        </label>
        <Lab2CurvesChart
          series={chartSeries}
          linearize={linearize}
          xLabel={linearize ? c.curvesAxisI2 : c.curvesAxisI}
          yLabel={c.curvesAxisF}
          hoverHint={c.hoverHint}
          formatSample={(s, k) =>
            `${s.label} · n=${k + 1}  ·  I = ${(s.currentA[k] ?? 0).toFixed(2)} A  ·  I² = ${((s.currentA[k] ?? 0) ** 2).toFixed(1)} A²  ·  F = ${(s.forceMn[k] ?? 0).toFixed(2)} mN`
          }
        />
        <p className={BODY}>{c.curvesLinearityNote(worstR2.toFixed(5))}</p>
        <p className={BODY}>
          {c.curvesSpreadNote(curves.slopeSpreadPct.toFixed(2))}
        </p>
        <p className={BODY}>{c.curvesSameRNote}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-zinc-600 dark:text-zinc-300">
            <caption className="pb-1 text-left text-xs text-zinc-500 dark:text-zinc-400">
              {c.curvesTableCaption}
            </caption>
            <thead className="text-zinc-800 dark:text-zinc-100">
              <tr>
                <th className={TH}>{c.colRun}</th>
                <th className={TH}>{c.colPoints}</th>
                <th className={TH}>{c.colSlope}</th>
                <th className={TH}>{c.colIntercept}</th>
                <th className={TH}>{c.colR2}</th>
                <th className={TH}>{c.colMu0Ideal}</th>
                <th className={TH}>{c.colMu0Corrected}</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {curveSeries.map((s, i) => {
                const fit = curves.fits[i];
                if (!fit) return null;
                return (
                  <tr key={s.label}>
                    <td className={TD}>{s.label}</td>
                    <td className={TD}>{s.currentA.length}</td>
                    <td className={TD}>
                      {(fit.slopeMnPerA2 * 1e3).toFixed(3)}·10⁻³
                    </td>
                    <td className={TD}>{fit.interceptMn.toFixed(3)}</td>
                    <td className={TD}>{fit.r2.toFixed(5)}</td>
                    <td className={TD}>{formatMu0(fit.mu0IdealHPerM)}</td>
                    <td className={TD}>{formatMu0(fit.mu0CorrectedHPerM)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <h3 className={H3}>{c.errorTableTitle}</h3>
        <p className={BODY}>{c.errorTableBody}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {c.errorRunFilterLabel}
          </span>
          {errorRunOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setErrorRun(opt)}
              aria-pressed={errorRun === opt}
              className={
                errorRun === opt
                  ? "rounded-md border border-sky-500 bg-sky-50 px-2 py-1 text-xs text-sky-800 dark:bg-sky-950 dark:text-sky-200"
                  : "rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
              }
            >
              {opt === "all" ? c.errorRunAll : opt}
            </button>
          ))}
        </div>
        <Lab2ErrorScatterChart
          points={toMicroPoints(filteredErrorTable.rows)}
          meanMu0Micro={filteredErrorTable.meanMu0HPerM * 1e6}
          xLabel={c.curvesAxisI}
          yLabel={c.errorChartPoint}
          pointLabel={c.errorChartPoint}
          meanLabel={c.errorChartMean}
          hoverHint={c.hoverHint}
          emptyLabel={c.errorChartEmpty}
          formatSample={(p, i) => {
            const r = filteredErrorTable.rows[i];
            return r
              ? `${r.run} · n=${r.n}  ·  I = ${r.currentA.toFixed(2)} A  ·  μ₀ = ${(r.mu0HPerM * 1e6).toFixed(3)} ± ${(r.errorHPerM * 1e6).toFixed(3)} ×10⁻⁶ H/m`
              : c.hoverHint;
          }}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-zinc-600 dark:text-zinc-300">
            <thead className="text-zinc-800 dark:text-zinc-100">
              <tr>
                <th className={TH}>{c.colRun}</th>
                <th className={TH}>{c.colCurrent}</th>
                <th className={TH}>{c.colForce}</th>
                <th className={TH}>{c.colMu0Point}</th>
                <th className={TH}>{c.colMu0PointError}</th>
                <th className={TH}>{c.colUpper}</th>
                <th className={TH}>{c.colLower}</th>
                <th className={TH}>{c.colErrorPct}</th>
                <th className={TH}>{c.colAccepted}</th>
                <th className={TH}>{c.colContainsAccepted}</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {filteredErrorTable.rows.map((r) => (
                <tr key={`${r.run}-${r.n}`}>
                  <td className={`${TD} font-sans`}>
                    {r.run} · n={r.n}
                  </td>
                  <td className={TD}>{r.currentA.toFixed(2)}</td>
                  <td className={TD}>{r.forceMn.toFixed(2)}</td>
                  <td className={TD}>{(r.mu0HPerM * 1e6).toFixed(3)}</td>
                  <td className={TD}>{(r.errorHPerM * 1e6).toFixed(3)}</td>
                  <td className={TD}>{(r.upperHPerM * 1e6).toFixed(3)}</td>
                  <td className={TD}>{(r.lowerHPerM * 1e6).toFixed(3)}</td>
                  <td className={TD}>{r.errorPct.toFixed(1)} %</td>
                  <td className={TD}>{(MU0_ACCEPTED * 1e6).toFixed(3)}</td>
                  <td
                    className={`${TD} font-sans ${r.containsReference ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {r.containsReference
                      ? c.containsAcceptedYes
                      : c.containsAcceptedNo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={BODY}>{c.errorTableNote}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric
            label={c.mErrorMeanMu0}
            value={`${(filteredErrorTable.meanMu0HPerM * 1e6).toFixed(3)}·10⁻⁶`}
          />
          <Metric
            label={c.mErrorMeanDelta}
            value={`± ${(filteredErrorTable.meanErrorHPerM * 1e6).toFixed(3)}·10⁻⁶`}
          />
          <Metric
            label={c.mErrorSpread}
            value={`± ${(filteredErrorTable.spreadHPerM * 1e6).toFixed(3)}·10⁻⁶`}
          />
        </div>
      </section>

      {/* 7 — continuous sweep */}
      <section className={SECTION}>
        <h2 className={H2}>{c.rampTitle}</h2>
        <p className={BODY}>{c.rampBody}</p>
        <LabXYChart
          xs={rampCurrentSquared}
          ys={rampForceMn}
          splitIndex={ramp.peakIndex}
          lines={rampFits}
          xLabel={c.rampAxisI2}
          yLabel={c.rampAxisF}
          risingLabel={c.rampRising}
          fallingLabel={c.rampFalling}
          hoverHint={c.hoverHint}
          formatSample={(index, x, f) =>
            `n = ${index}  ·  I = ${Math.sqrt(x).toFixed(2)} A  ·  I² = ${x.toFixed(1)} A²  ·  F = ${f.toFixed(2)} mN`
          }
        />
        <p className={BODY}>
          {c.rampHysteresisNote(ramp.hysteresisPct.toFixed(2))}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric
            label={c.mRampPeak}
            value={`${ramp.peakCurrentA.toFixed(2)} A`}
          />
          <Metric
            label={c.mRampSlope}
            value={`${(ramp.overall.slopeMnPerA2 * 1e3).toFixed(3)}·10⁻³ mN/A²`}
          />
          <Metric label={c.mRampR2} value={ramp.overall.r2.toFixed(5)} />
          <Metric
            label={c.mRampGap}
            value={`${Math.abs(ramp.gapMn).toFixed(3)} mN`}
          />
          <Metric
            label={c.mRampHysteresis}
            value={`${ramp.hysteresisPct.toFixed(2)} %`}
          />
        </div>

        <h3 className={H3}>{c.rampErrorTitle}</h3>
        <p className={BODY}>{c.rampErrorBody}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {c.rampErrorFilterLabel}
          </span>
          {(
            [
              ["all", c.errorRunAll],
              ["rising", c.rampRising],
              ["falling", c.rampFalling],
            ] as const
          ).map(([opt, label]) => (
            <button
              key={opt}
              type="button"
              onClick={() => setRampErrorBranch(opt)}
              aria-pressed={rampErrorBranch === opt}
              className={
                rampErrorBranch === opt
                  ? "rounded-md border border-sky-500 bg-sky-50 px-2 py-1 text-xs text-sky-800 dark:bg-sky-950 dark:text-sky-200"
                  : "rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
              }
            >
              {label}
            </button>
          ))}
        </div>
        <Lab2ErrorScatterChart
          points={toMicroPoints(filteredRampErrorTable.rows)}
          meanMu0Micro={filteredRampErrorTable.meanMu0HPerM * 1e6}
          xLabel={c.rampAxisI}
          yLabel={c.errorChartPoint}
          pointLabel={c.errorChartPoint}
          meanLabel={c.errorChartMean}
          hoverHint={c.hoverHint}
          emptyLabel={c.errorChartEmpty}
          formatSample={(p, i) => {
            const r = filteredRampErrorTable.rows[i];
            return r
              ? `${r.run === "rising" ? c.rampRising : c.rampFalling} · n=${r.n}  ·  I = ${r.currentA.toFixed(2)} A  ·  μ₀ = ${(r.mu0HPerM * 1e6).toFixed(3)} ± ${(r.errorHPerM * 1e6).toFixed(3)} ×10⁻⁶ H/m`
              : c.hoverHint;
          }}
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric
            label={c.mErrorMeanMu0}
            value={`${(filteredRampErrorTable.meanMu0HPerM * 1e6).toFixed(3)}·10⁻⁶`}
          />
          <Metric
            label={c.mErrorMeanDelta}
            value={`± ${(filteredRampErrorTable.meanErrorHPerM * 1e6).toFixed(3)}·10⁻⁶`}
          />
          <Metric
            label={c.mErrorSpread}
            value={`± ${(filteredRampErrorTable.spreadHPerM * 1e6).toFixed(3)}·10⁻⁶`}
          />
        </div>
      </section>

      {/* 8 — the result */}
      <section className={SECTION}>
        <h2 className={H2}>{c.resultTitle}</h2>
        <p className={BODY}>{c.resultBody}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-zinc-600 dark:text-zinc-300">
            <caption className="pb-1 text-left text-xs text-zinc-500 dark:text-zinc-400">
              {c.resultTableCaption}
            </caption>
            <thead className="text-zinc-800 dark:text-zinc-100">
              <tr>
                <th className={TH}>{c.colRoute}</th>
                <th className={TH}>{c.colMu0Ideal}</th>
                <th className={TH}>{c.colDelta}</th>
                <th className={TH}>{c.colMu0Corrected}</th>
                <th className={TH}>{c.colDelta}</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => (
                <tr key={r.label}>
                  <td className={TD}>{r.label}</td>
                  <td className={`${TD} font-mono`}>{formatMu0(r.ideal)}</td>
                  <td className={`${TD} font-mono`}>
                    {signedPct(deltaFromAcceptedPct(r.ideal))} %
                  </td>
                  <td className={`${TD} font-mono`}>
                    {formatMu0(r.corrected)}
                  </td>
                  <td className={`${TD} font-mono`}>
                    {signedPct(deltaFromAcceptedPct(r.corrected))} %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={BODY}>
          {c.resultIdealNote(
            formatMu0(meanIdeal),
            Math.abs(deltaFromAcceptedPct(meanIdeal)).toFixed(1),
          )}
        </p>
        <p className={BODY}>
          {c.resultCorrectedNote(
            formatMu0(meanCorrected),
            signedPct(deltaFromAcceptedPct(meanCorrected)),
          )}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label={c.mMu0Final} value={formatMu0(meanCorrected)} />
          <Metric
            label={c.mMu0Error}
            value={`± ${budget.relativePct.toFixed(1)} %`}
          />
          <Metric
            label={c.mMu0Delta}
            value={`${signedPct(deltaFromAcceptedPct(meanCorrected))} %`}
          />
          <Metric label={c.mMu0Accepted} value={formatMu0(MU0_ACCEPTED)} />
        </div>
        <p className="rounded-md border border-emerald-300 bg-emerald-50 p-2 text-sm leading-relaxed text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          {c.resultFinal(
            formatMu0(meanCorrected),
            budget.relativePct.toFixed(1),
            Math.abs(deltaFromAcceptedPct(meanCorrected)).toFixed(1),
          )}
        </p>
      </section>

      {/* 9 — error budget */}
      <section className={SECTION}>
        <h2 className={H2}>{c.errorTitle}</h2>
        <p className={BODY}>{c.errorBody}</p>
        <Lab2ErrorChart
          labels={c.errorChart}
          slopeMnPerA2={curves.meanSlopeMnPerA2}
          fromA={2}
          toA={21}
        />
        <p className={BODY}>
          {c.errorAnswer(
            c.errorChart.separation,
            ((budget.fromSeparation / budget.totalAbs) * 100).toFixed(0),
            crossoverA === null ? "—" : crossoverA.toFixed(1),
          )}
        </p>
        <p className={BODY}>{c.errorPractical}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label="ΔI" value={`± ${CURRENT_ERROR_A.toFixed(2)} A`} />
          <Metric label="ΔF" value={`± ${FORCE_ERROR_MN.toFixed(2)} mN`} />
          <Metric
            label="Δr"
            value={`± ${(SEPARATION_ERROR_M * 1000).toFixed(2)} mm`}
          />
          <Metric
            label="Δl"
            value={`± ${(LENGTH_ERROR_M * 1000).toFixed(0)} mm`}
          />
        </div>
      </section>

      {/* 10 — the guide's Nota */}
      <section className={SECTION}>
        <h2 className={H2}>{c.noteTitle}</h2>
        <p className={BODY}>{c.noteBody}</p>
        <p className="rounded-md border border-zinc-200 bg-zinc-50 p-2 text-sm leading-relaxed text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
          {c.noteAnswer(
            factor.shortfallPct.toFixed(1),
            budget.relativePct.toFixed(1),
          )}
        </p>
        <p className={BODY}>
          {c.noteImplied(
            impliedMm.toFixed(2),
            (SEPARATION_M * 1000).toFixed(2),
          )}
        </p>
      </section>

      <section className={SECTION}>
        <h2 className={H2}>{c.conclusionsTitle}</h2>
        <ul className={`${BODY} list-disc pl-5`}>
          {c.conclusionsBody.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section className={SECTION}>
        <h2 className={H2}>{c.bridgeTitle}</h2>
        <p className={BODY}>{c.bridgeBody}</p>
      </section>

      <ProjectCredits
        tag="Laboratorio · Teoría de los Campos · UTN · FRBA"
        subtitle={c.title}
        description={c.subtitle}
      />
    </main>
  );
}
