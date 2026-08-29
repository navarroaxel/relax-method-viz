"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  Lab1Chart,
  type ChartMarker,
  type ChartSeries,
} from "@/components/Lab1Chart";
import { Lab1CompassDiagram } from "@/components/Lab1CompassDiagram";
import { Lab1Diagram } from "@/components/Lab1Diagram";
import { Lab1DirectDiagram } from "@/components/Lab1DirectDiagram";
import {
  Lab1IndirectChart,
  type IndirectChartSession,
} from "@/components/Lab1IndirectChart";
import { Lab1XYChart, type XYFitLine } from "@/components/Lab1XYChart";
import { ProjectCredits } from "@/components/ProjectCredits";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  analyzeStep,
  DIRECT_B_MT,
  ESCALON_DT_S,
  escalonCurrentA,
  escalonForceMn,
  fieldSeriesMt,
  LOOP_LENGTH_M,
} from "@/lib/lab1Escalon";

import {
  analyzeRamp,
  branchGap,
  predictFromStepResponse,
  RAMP_DT_S,
  rampCurrentA,
  rampForceMn,
} from "@/lib/lab1MedicionContinua";

import {
  indirectSessions,
  summarizeIndirect,
} from "@/lib/lab1MedicionIndirecta";

import {
  COIL_CURRENT_A,
  COIL_CURRENT_ERROR_A,
  directFieldMt,
  POSITION_LABELS,
  summarizeDirect,
} from "@/lib/lab1MedicionDirecta";

import {
  SOLENOID_LENGTH_M,
  SOLENOID_TURNS,
  theoreticalFieldMt,
} from "@/lib/lab1Solenoid";

import { percentDelta, summarizeFieldRoutes } from "@/lib/lab1FieldSummary";

import { LAB1_COPY } from "./copy";

const CARD =
  "rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900";
const SECTION = `${CARD} flex flex-col gap-2`;
const H2 = "text-base font-semibold text-zinc-900 dark:text-zinc-100";
const BODY = "text-sm leading-relaxed text-zinc-600 dark:text-zinc-300";

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

export function Lab1Page() {
  const { language, toggle } = useLanguage();
  const c = LAB1_COPY[language];
  const [showMarkers, setShowMarkers] = useState(true);
  const [directHoverIndex, setDirectHoverIndex] = useState<number | null>(
    null,
  );

  const analysis = useMemo(
    () => analyzeStep(escalonForceMn, escalonCurrentA),
    [],
  );
  const fieldMt = useMemo(
    () => fieldSeriesMt(escalonForceMn, escalonCurrentA),
    [],
  );

  const ramp = useMemo(
    () => analyzeRamp(rampForceMn, rampCurrentA, LOOP_LENGTH_M),
    [],
  );

  const indirect = useMemo(
    () => summarizeIndirect(indirectSessions, LOOP_LENGTH_M),
    [],
  );

  const indirectChartSessions = useMemo<IndirectChartSession[]>(
    () =>
      indirectSessions.map((s, i) => ({
        label: s.label,
        n: s.n,
        forceMn: s.forceMn,
        currentA: s.currentA,
        outlierIndices: indirect.sessions[i]?.outlierIndices ?? [],
        slopeMnPerA: indirect.sessions[i]?.fitClean.slopeMnPerA ?? 0,
        interceptMn: indirect.sessions[i]?.fitClean.interceptMn ?? 0,
      })),
    [indirect],
  );

  const direct = useMemo(() => summarizeDirect(), []);

  const directSeries = useMemo<ChartSeries[]>(
    () => [
      { values: directFieldMt, axis: "left", label: c.chartField, color: "field" },
    ],
    [c.chartField],
  );

  const directMarkers = useMemo<ChartMarker[]>(() => {
    const marks: ChartMarker[] = [];
    let prev: string | null = null;
    POSITION_LABELS.forEach((label, i) => {
      if (label === prev) return;
      prev = label;
      marks.push({
        timeS: i,
        label:
          label === "center"
            ? c.markerCenter
            : label === "end"
              ? c.markerEnd
              : c.markerOutside,
        faint: label === "outside",
      });
    });
    return marks;
  }, [c.markerCenter, c.markerEnd, c.markerOutside]);

  // What the escalón's own sensor would have reported for this sweep. If the
  // hysteresis were purely its lag, this would open the same loop.
  const lagLoop = useMemo(() => {
    const perAmp = predictFromStepResponse(
      rampCurrentA,
      escalonForceMn,
      analysis.forceSteadyMn,
      Math.round(RAMP_DT_S / ESCALON_DT_S),
    );
    const predicted = Float64Array.from(
      perAmp,
      (v) => v * ramp.overall.slopeMnPerA,
    );
    const measured = branchGap(
      rampForceMn,
      rampCurrentA,
      ramp.peakIndex,
    );
    const fromLag = branchGap(predicted, rampCurrentA, ramp.peakIndex);
    return {
      measuredGapMn: measured.gapMn,
      explainedPct: (fromLag.gapMn / measured.gapMn) * 100,
    };
  }, [analysis.forceSteadyMn, ramp]);

  const rampSeries = useMemo<ChartSeries[]>(
    () => [
      {
        values: rampForceMn,
        axis: "left",
        label: c.chartForce,
        color: "force",
      },
      {
        values: rampCurrentA,
        axis: "right",
        label: c.chartCurrent,
        color: "current",
      },
    ],
    [c.chartForce, c.chartCurrent],
  );

  const rampFits = useMemo<XYFitLine[]>(
    () => [
      {
        slope: ramp.overall.slopeMnPerA,
        intercept: ramp.overall.interceptMn,
        tone: "overall",
        label: c.rampOverallFit,
      },
      {
        slope: ramp.rising.slopeMnPerA,
        intercept: ramp.rising.interceptMn,
        tone: "rising",
        label: c.rampRisingFit,
      },
      {
        slope: ramp.falling.slopeMnPerA,
        intercept: ramp.falling.interceptMn,
        tone: "falling",
        label: c.rampFallingFit,
      },
    ],
    [ramp, c.rampOverallFit, c.rampRisingFit, c.rampFallingFit],
  );

  const stepSeries = useMemo<ChartSeries[]>(
    () => [
      {
        values: escalonForceMn,
        axis: "left",
        label: c.chartForce,
        color: "force",
      },
      {
        values: escalonCurrentA,
        axis: "right",
        label: c.chartCurrent,
        color: "current",
      },
    ],
    [c.chartForce, c.chartCurrent],
  );

  const fieldSeries = useMemo<ChartSeries[]>(
    () => [
      { values: fieldMt, axis: "left", label: c.chartField, color: "field" },
    ],
    [fieldMt, c.chartField],
  );

  const markers = useMemo<ChartMarker[]>(
    () => [
      { timeS: analysis.onsetS, label: c.markerOnset, faint: true },
      { timeS: analysis.t10S, label: c.markerT10, faint: true },
      { timeS: analysis.t90S, label: c.markerT90 },
      { timeS: analysis.peakTimeS, label: c.markerPeak },
      { timeS: analysis.settlingTimeS, label: c.markerSettle },
    ],
    [analysis, c],
  );

  const deltaPct = Math.abs(percentDelta(analysis.fieldMt, DIRECT_B_MT));
  // Spread across the three independent routes to B, as a percentage of the
  // smallest of them.
  const fields = [analysis.fieldMt, ramp.overall.fieldMt, DIRECT_B_MT];
  const spreadPct =
    ((Math.max(...fields) - Math.min(...fields)) / Math.min(...fields)) * 100;

  // Same spread, with the point-by-point indirect measurement added as a
  // fourth route.
  const fieldsFour = [...fields, indirect.meanFieldMt];
  const spreadFourPct =
    ((Math.max(...fieldsFour) - Math.min(...fieldsFour)) /
      Math.min(...fieldsFour)) *
    100;

  // The average B the guide asks for, combining the four independent routes
  // — with the spread between them (sample std) standing in for its error,
  // since each route's own instrument error is dwarfed by the disagreement
  // between methods.
  const { meanMt: measuredAvgMt, stdMt: measuredStdMt } =
    summarizeFieldRoutes(fieldsFour);

  // The ideal-solenoid formula against that same average — not against any
  // single route, since none of them is "the" answer.
  const theory = theoreticalFieldMt(COIL_CURRENT_A, COIL_CURRENT_ERROR_A);
  const theoryDeltaPct = percentDelta(theory.fieldMt, measuredAvgMt);

  // What the guide literally asks for: both calculated results (the
  // force-based measurement and the theoretical formula) checked against the
  // direct probe measurement specifically, not the four-way average.
  const theoryVsDirectPct = Math.abs(percentDelta(theory.fieldMt, DIRECT_B_MT));

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-3 p-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {c.title}
          </h1>
          <button
            type="button"
            onClick={toggle}
            className="shrink-0 rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {language === "es" ? "EN" : "ES"}
          </button>
        </div>
        <p className={BODY}>{c.subtitle}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{c.source}</p>
        <Link
          href="/"
          className="text-xs text-blue-700 hover:underline dark:text-blue-400"
        >
          {c.backToSim}
        </Link>
      </header>

      <section className={SECTION}>
        <h2 className={H2}>{c.goalTitle}</h2>
        <p className={BODY}>{c.goalBody}</p>
        <p className="text-center font-mono text-base text-zinc-900 dark:text-zinc-100">
          {c.formula}
        </p>
        <p className={BODY}>{c.formulaNote}</p>
        <p className="text-center font-mono text-sm text-zinc-700 dark:text-zinc-200">
          {c.errorFormula}
        </p>
        <p className={BODY}>{c.errorNote}</p>
      </section>

      <section className={SECTION}>
        <h2 className={H2}>{c.directTitle}</h2>
        <p className={BODY}>{c.directCompassNote}</p>
        <Lab1CompassDiagram
          labels={c.compassDiagram}
          coilCurrentA={COIL_CURRENT_A}
        />
        <p className={BODY}>{c.directBody}</p>
        <Lab1DirectDiagram
          labels={c.directDiagram}
          fieldMt={directFieldMt}
          positions={POSITION_LABELS}
          coilCurrentA={COIL_CURRENT_A}
          highlightIndex={directHoverIndex}
        />
        <Lab1Chart
          series={directSeries}
          leftLabel={c.chartField}
          markers={directMarkers}
          showMarkers={true}
          timeLabel={c.chartN}
          hoverHint={c.hoverHint}
          dtS={1}
          formatX={(n) => `n = ${n.toFixed(0)}`}
          onHoverIndex={setDirectHoverIndex}
        />
        <p className={BODY}>{c.directOrthogonalNote}</p>
        <p className={BODY}>{c.directValidityNote}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric
            label={c.mCenterField}
            value={`${direct.groups.center.meanMt.toFixed(2)} mT`}
          />
          <Metric
            label={c.mEndField}
            value={`${direct.groups.end.meanMt.toFixed(2)} mT`}
          />
          <Metric
            label={c.mEndRatio}
            value={direct.endToCenterRatio.toFixed(2)}
          />
          <Metric
            label={c.mOutsideField}
            value={`${direct.groups.outside.meanMt.toFixed(2)} mT`}
          />
          <Metric
            label={c.mCoilCurrent}
            value={`${COIL_CURRENT_A.toFixed(2)} ± ${COIL_CURRENT_ERROR_A.toFixed(3)} A`}
          />
        </div>
      </section>

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

      <section className={SECTION}>
        <h2 className={H2}>{c.diagramTitle}</h2>
        <p className={BODY}>{c.diagramBody}</p>
        <Lab1Diagram
          labels={c.diagram}
          fieldMt={analysis.fieldMt}
          referenceForceMn={analysis.forceSteadyMn}
        />
      </section>

      <section className={SECTION}>
        <h2 className={H2}>{c.indirectTitle}</h2>
        <p className={BODY}>{c.indirectBody}</p>
        <Lab1IndirectChart
          sessions={indirectChartSessions}
          xLabel={c.indirectAxisI}
          yLabel={c.indirectAxisF}
          hoverHint={c.hoverHint}
          outlierLabel={c.indirectOutlierLabel}
          formatSample={(session, k) =>
            `${session.label} · n=${session.n[k]}  ·  I = ${(session.currentA[k] ?? 0).toFixed(2)} A  ·  F = ${(session.forceMn[k] ?? 0).toFixed(2)} mN`
          }
        />
        <p className={BODY}>{c.indirectOutlierNote}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label={c.mSessions} value={`${indirect.sessions.length}`} />
          <Metric label={c.mIndirectPoints} value={`${indirect.totalPoints}`} />
          <Metric
            label={c.mIndirectOutliers}
            value={`${indirect.totalOutliers}`}
          />
          <Metric
            label={c.mFieldIndirect}
            value={`${indirect.meanFieldMt.toFixed(2)} mT`}
          />
          <Metric
            label={c.mFieldSpread}
            value={`± ${indirect.fieldSpreadMt.toFixed(2)} mT`}
          />
        </div>
      </section>

      <section className={SECTION}>
        <h2 className={H2}>{c.stepTitle}</h2>
        <p className={BODY}>{c.stepBody}</p>
        <p className="rounded-md border border-zinc-200 bg-zinc-50 p-2 text-sm leading-relaxed text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
          {c.inrushNote}
        </p>
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={showMarkers}
            onChange={(e) => setShowMarkers(e.target.checked)}
          />
          {c.markersToggle}
        </label>
        <Lab1Chart
          series={stepSeries}
          leftLabel={c.chartForce}
          rightLabel={c.chartCurrent}
          markers={markers}
          band={{
            axis: "left",
            from: analysis.forceSteadyMn * 0.98,
            to: analysis.forceSteadyMn * 1.02,
            label: c.bandLabel,
          }}
          showMarkers={showMarkers}
          timeLabel={c.chartTime}
          hoverHint={c.hoverHint}
        />
        <h3 className="pt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {c.metricsTitle}
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric
            label={c.mForceSteady}
            value={`${analysis.forceSteadyMn.toFixed(2)} mN`}
          />
          <Metric
            label={c.mCurrentSteady}
            value={`${analysis.currentSteadyA.toFixed(2)} A`}
          />
          <Metric
            label={c.mRise}
            value={`${(analysis.riseTimeS * 1000).toFixed(0)} ms`}
          />
          <Metric
            label={c.mOvershoot}
            value={`${analysis.overshootPct.toFixed(1)} %`}
          />
          <Metric
            label={c.mSettle}
            value={`${(analysis.settlingTimeS * 1000).toFixed(0)} ms`}
          />
          <Metric label={c.mZeta} value={analysis.zeta.toFixed(2)} />
          <Metric
            label={c.mNatFreq}
            value={`${analysis.naturalFreqHz.toFixed(1)} Hz`}
          />
          <Metric
            label={c.mField}
            value={`${analysis.fieldMt.toFixed(2)} mT`}
          />
        </div>
      </section>

      <section className={SECTION}>
        <h2 className={H2}>{c.lessonTitle}</h2>
        <ul className={`${BODY} list-disc pl-5`}>
          {c.lessonBody.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section className={SECTION}>
        <h2 className={H2}>{c.rampTitle}</h2>
        <p className={BODY}>{c.rampBody}</p>
        <p className={BODY}>{c.rampTimeBody}</p>
        <Lab1Chart
          series={rampSeries}
          leftLabel={c.chartForce}
          rightLabel={c.chartCurrent}
          showMarkers={false}
          timeLabel={c.chartTime}
          hoverHint={c.hoverHint}
          dtS={RAMP_DT_S}
        />
        <p className={BODY}>{c.rampHysteresis}</p>
        <Lab1XYChart
          xs={rampCurrentA}
          ys={rampForceMn}
          splitIndex={ramp.peakIndex}
          lines={rampFits}
          xLabel={c.rampAxisI}
          yLabel={c.rampAxisF}
          risingLabel={c.rampRising}
          fallingLabel={c.rampFalling}
          hoverHint={c.hoverHint}
          formatSample={(index, i, f) =>
            `t = ${(index * RAMP_DT_S).toFixed(1)} s  ·  I = ${i.toFixed(2)} A  ·  F = ${f.toFixed(2)} mN`
          }
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label={c.mPeak} value={`${ramp.peakCurrentA.toFixed(2)} A`} />
          <Metric
            label={c.mRate}
            value={`${ramp.maxRateAPerS.toFixed(1)} A/s`}
          />
          <Metric
            label={c.mSlope}
            value={`${ramp.overall.slopeMnPerA.toFixed(4)} mN/A`}
          />
          <Metric label={c.mR2} value={ramp.overall.r2.toFixed(4)} />
          <Metric
            label={c.mTare}
            value={`${ramp.overall.interceptMn.toFixed(3)} mN`}
          />
          <Metric
            label={c.mFieldRamp}
            value={`${ramp.overall.fieldMt.toFixed(2)} mT`}
          />
          <Metric
            label={c.mHysteresis}
            value={`${ramp.hysteresisPct.toFixed(1)} %`}
          />
          <Metric
            label={c.mLag}
            value={`${(ramp.bestLagS * 1000).toFixed(0)} ms`}
          />
          <Metric
            label={c.mDelayStep}
            value={`${(analysis.effectiveDelayS * 1000).toFixed(0)} ms`}
          />
          <Metric
            label={c.mLoop}
            value={`${lagLoop.measuredGapMn.toFixed(3)} mN`}
          />
          <Metric
            label={c.mLoopExplained}
            value={`${lagLoop.explainedPct.toFixed(0)} %`}
          />
        </div>
        <p className={BODY}>{c.rampLagNote}</p>
        <p className={BODY}>{c.rampDelayNote}</p>
      </section>

      <section className={SECTION}>
        <h2 className={H2}>{c.fieldTitle}</h2>
        <p className={BODY}>{c.fieldBody}</p>
        <Lab1Chart
          series={fieldSeries}
          leftLabel={`${c.chartField} — l = ${LOOP_LENGTH_M * 100} cm`}
          markers={markers}
          band={{
            axis: "left",
            from: analysis.fieldMt * 0.98,
            to: analysis.fieldMt * 1.02,
            label: c.bandLabel,
          }}
          showMarkers={showMarkers}
          timeLabel={c.chartTime}
          hoverHint={c.hoverHint}
        />
        <p className={BODY}>
          {c.fieldCompare(
            analysis.fieldMt.toFixed(2),
            DIRECT_B_MT.toFixed(2),
            deltaPct.toFixed(1),
          )}
        </p>
        <p className={BODY}>
          {c.fieldThree(ramp.overall.fieldMt.toFixed(2), spreadPct.toFixed(1))}
        </p>
        <p className={BODY}>
          {c.fieldFour(
            indirect.meanFieldMt.toFixed(2),
            spreadFourPct.toFixed(1),
          )}
        </p>
        <h3 className="pt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {c.averageTitle}
        </h3>
        <p className={BODY}>
          {c.fieldAverage(measuredAvgMt.toFixed(2), measuredStdMt.toFixed(2))}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric
            label={c.mFieldAverage}
            value={`${measuredAvgMt.toFixed(2)} ± ${measuredStdMt.toFixed(2)} mT`}
          />
        </div>
        <h3 className="pt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {c.theoryTitle}
        </h3>
        <p className={BODY}>
          {c.fieldTheory(
            theory.fieldMt.toFixed(2),
            theory.errorMt.toFixed(3),
            theoryDeltaPct.toFixed(1),
          )}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label={c.mTheoryTurns} value={`${SOLENOID_TURNS}`} />
          <Metric
            label={c.mTheoryLength}
            value={`${(SOLENOID_LENGTH_M * 1000).toFixed(0)} mm`}
          />
          <Metric
            label={c.mTheoryField}
            value={`${theory.fieldMt.toFixed(2)} ± ${theory.errorMt.toFixed(3)} mT`}
          />
          <Metric
            label={c.mTheoryDelta}
            value={`${theoryDeltaPct >= 0 ? "+" : ""}${theoryDeltaPct.toFixed(1)} %`}
          />
        </div>
        <p className={BODY}>
          {c.fieldCalculatedVsDirect(
            deltaPct.toFixed(1),
            theoryVsDirectPct.toFixed(1),
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
