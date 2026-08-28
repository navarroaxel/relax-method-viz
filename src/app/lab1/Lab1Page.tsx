"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  Lab1Chart,
  type ChartMarker,
  type ChartSeries,
} from "@/components/Lab1Chart";
import { Lab1Diagram } from "@/components/Lab1Diagram";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  analyzeStep,
  DIRECT_B_MT,
  escalonCurrentA,
  escalonForceMn,
  fieldSeriesMt,
  LOOP_LENGTH_M,
} from "@/lib/lab1Escalon";

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

  const analysis = useMemo(
    () => analyzeStep(escalonForceMn, escalonCurrentA),
    [],
  );
  const fieldMt = useMemo(
    () => fieldSeriesMt(escalonForceMn, escalonCurrentA),
    [],
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

  const deltaPct = Math.abs(
    ((analysis.fieldMt - DIRECT_B_MT) / DIRECT_B_MT) * 100,
  );

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
      </section>

      <section className={SECTION}>
        <h2 className={H2}>{c.checklistTitle}</h2>
        <ul className={`${BODY} list-disc pl-5`}>
          {c.checklist.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section className={SECTION}>
        <h2 className={H2}>{c.bridgeTitle}</h2>
        <p className={BODY}>{c.bridgeBody}</p>
      </section>
    </main>
  );
}
