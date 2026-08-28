"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  escalonCurrentA,
  escalonForceMn,
  ESCALON_DT_S,
  LOOP_LENGTH_M,
} from "@/lib/lab1Escalon";

export interface DiagramLabels {
  supply20: string;
  supply5: string;
  cassy: string;
  forceSensor: string;
  support: string;
  solenoid: string;
  loop: string;
  fieldB: string;
  forceF: string;
  loopCurrent: string;
  coilCurrent: string;
  play: string;
  pause: string;
  replayHint: string;
  manualHint: string;
  elapsed: string;
}

interface Lab1DiagramProps {
  labels: DiagramLabels;
  /** Steady-state field used to predict F in manual mode, in mT. */
  fieldMt: number;
  /** Force at the plateau of the capture, used to normalise arrow lengths. */
  referenceForceMn: number;
}

/** Coil current is fixed at 5 A for the whole experiment (guía §3.2 c). */
const COIL_CURRENT_A = 5;
/** Loop current range of the main sweep, in A. */
const MAX_MANUAL_CURRENT_A = 12;

const TURNS = 17;
const COIL_X0 = 206;
const COIL_DX = 24;
const COIL_CY = 236;
const COIL_RY = 50;
const COIL_RX = 13;
/** Index of the winding gap the conductor loop is lowered into. */
const LOOP_TURN = 8;

const LOOP_X = COIL_X0 + (LOOP_TURN + 0.5) * COIL_DX;
const LOOP_HALF_W = 16;
const LOOP_BOTTOM = COIL_CY + 28;
/** Bottom edge of the force-sensor body: where the loop holder hangs from. */
const SENSOR_BOTTOM = 134;
/** Height at which the supply leads join the loop holder. */
const FEED_Y = 142;

/** Max upward travel of the loop when the sensor is fully loaded, in px. */
const MAX_DEFLECTION = 13;

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/** Seconds per pulse lap: more current, faster flow. Zero current freezes. */
function pulsePeriod(currentA: number): number {
  if (currentA <= 0.05) return 0;
  return 5 / Math.min(currentA, 24);
}

interface WireProps {
  d: string;
  /** Seconds per pulse lap; 0 disables the animation. */
  period: number;
  /** Fraction of a lap to offset this segment's pulse by. */
  delayFraction?: number;
  className: string;
}

/**
 * A conductor: a solid stroke plus a short dash travelling along it. Every
 * path declares pathLength="100", so one pulse traverses any segment in the
 * same time no matter its real length — the pulses stay in step around the
 * circuit.
 */
function Wire({ d, period, delayFraction = 0, className }: WireProps) {
  return (
    <g className={className} fill="none">
      <path d={d} strokeWidth="2.5" opacity={0.55} />
      {period > 0 && (
        <path
          d={d}
          pathLength="100"
          strokeWidth="3.5"
          strokeLinecap="round"
          className="pulse"
          style={{
            animationDuration: `${period}s`,
            animationDelay: `${-delayFraction * period}s`,
          }}
        />
      )}
    </g>
  );
}

function Chip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-950">
      <span className={tone}>{label}</span>
      <span className="text-zinc-900 dark:text-zinc-100"> = {value}</span>
    </span>
  );
}

export function Lab1Diagram({
  labels,
  fieldMt,
  referenceForceMn,
}: Lab1DiagramProps) {
  const reducedMotion = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [sampleIndex, setSampleIndex] = useState<number | null>(null);
  const [manualCurrent, setManualCurrent] = useState(8);
  const rafRef = useRef<number | null>(null);

  // Playback walks the real capture in wall-clock time and loops, so the lag
  // between the current step and the force response shows up on the bench
  // drawing itself, not only on the chart.
  useEffect(() => {
    if (!playing) return;
    const total = escalonForceMn.length * ESCALON_DT_S * 1000;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - start) % total;
      setSampleIndex(Math.floor(elapsed / (ESCALON_DT_S * 1000)));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      if (p) setSampleIndex(null);
      return !p;
    });
  }, []);

  const replaying = playing && sampleIndex !== null;
  const loopCurrentA = replaying
    ? (escalonCurrentA[sampleIndex] ?? 0)
    : manualCurrent;
  // Manual mode predicts the force from the measured field; playback shows
  // what the sensor actually reported. F[mN] = I · l · B[mT].
  const forceMn = replaying
    ? (escalonForceMn[sampleIndex] ?? 0)
    : manualCurrent * LOOP_LENGTH_M * fieldMt;

  const load = Math.max(0, Math.min(forceMn / referenceForceMn, 1.2));
  const deflection = load * MAX_DEFLECTION;
  const arrowLen = 10 + load * 44;

  const loopPeriod = reducedMotion ? 0 : pulsePeriod(loopCurrentA);
  const coilPeriod = reducedMotion ? 0 : pulsePeriod(COIL_CURRENT_A);

  const turns = Array.from({ length: TURNS }, (_, k) => COIL_X0 + k * COIL_DX);
  const coilX1 = COIL_X0 + (TURNS - 1) * COIL_DX;
  const loopBottom = LOOP_BOTTOM - deflection;

  const amber = "stroke-amber-600 dark:stroke-amber-400";
  const sky = "stroke-sky-600 dark:stroke-sky-400";
  // Drawn from the right leg down and back up the left one, so the pulse runs
  // the way the current does: in from CASSY input B, out towards the supply.
  const loopPath = `M${LOOP_X + LOOP_HALF_W} ${SENSOR_BOTTOM} L${LOOP_X + LOOP_HALF_W} ${loopBottom} L${LOOP_X - LOOP_HALF_W} ${loopBottom} L${LOOP_X - LOOP_HALF_W} ${SENSOR_BOTTOM}`;

  return (
    <div className="flex flex-col gap-2">
      <svg
        viewBox="0 0 720 344"
        role="img"
        aria-label={`${labels.solenoid} — ${labels.loop}`}
        className="w-full rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950"
      >
        <style>{`
          .pulse {
            stroke-dasharray: 7 93;
            animation-name: lab1-pulse;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }
          @keyframes lab1-pulse { to { stroke-dashoffset: -100; } }
          @media (prefers-reduced-motion: reduce) { .pulse { animation: none; } }
          .lbl { font: 11px ui-sans-serif, system-ui, sans-serif; }
        `}</style>
        <defs>
          <marker
            id="lab1-arrow-b"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path
              d="M0,0 L10,5 L0,10 z"
              className="fill-emerald-600 dark:fill-emerald-400"
            />
          </marker>
          <marker
            id="lab1-arrow-f"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path
              d="M0,0 L10,5 L0,10 z"
              className="fill-rose-600 dark:fill-rose-400"
            />
          </marker>
        </defs>

        {/* ---- Instrument boxes ------------------------------------------ */}
        <g className="fill-white stroke-zinc-400 dark:fill-zinc-900 dark:stroke-zinc-600">
          <rect x="16" y="20" width="116" height="46" rx="4" />
          <rect x="16" y="92" width="116" height="46" rx="4" />
          <rect x="600" y="20" width="102" height="62" rx="4" />
          <rect x={LOOP_X - 47} y="96" width="94" height="38" rx="4" />
        </g>
        <g className="lbl fill-zinc-700 dark:fill-zinc-200">
          <text x="74" y="40" textAnchor="middle">
            {labels.supply20}
          </text>
          <text
            x="74"
            y="56"
            textAnchor="middle"
            className="fill-zinc-500 dark:fill-zinc-400"
          >
            20 A
          </text>
          <text x="74" y="112" textAnchor="middle">
            {labels.supply5}
          </text>
          <text
            x="74"
            y="128"
            textAnchor="middle"
            className="fill-zinc-500 dark:fill-zinc-400"
          >
            5 A
          </text>
          <text x="651" y="44" textAnchor="middle">
            {labels.cassy}
          </text>
          <text
            x="651"
            y="62"
            textAnchor="middle"
            className="fill-zinc-500 dark:fill-zinc-400"
          >
            A: F · B: I
          </text>
          <text x={LOOP_X} y="120" textAnchor="middle">
            {labels.forceSensor}
          </text>
          <text
            x={LOOP_X}
            y="26"
            textAnchor="middle"
            className="fill-zinc-500 dark:fill-zinc-400"
          >
            {labels.support}
          </text>
        </g>

        {/* Support structure holding the force sensor. */}
        <g
          className="stroke-zinc-400 dark:stroke-zinc-600"
          strokeWidth="4"
          fill="none"
        >
          <path d={`M${LOOP_X} 34 L${LOOP_X} 96`} />
          <path d={`M${LOOP_X - 70} 34 L${LOOP_X + 70} 34`} />
        </g>
        {/* Sensor signal cable to CASSY input A. */}
        <path
          d={`M${LOOP_X + 47} 106 L556 106 L556 40 L600 40`}
          className="stroke-zinc-400 dark:stroke-zinc-500"
          fill="none"
          strokeWidth="1.6"
        />

        {/* ---- Solenoid: solid turns with a pulse hopping down the coil --- */}
        <g className={amber} fill="none">
          {turns.map((x, k) => (
            <g key={x}>
              <ellipse
                cx={x}
                cy={COIL_CY}
                rx={COIL_RX}
                ry={COIL_RY}
                strokeWidth="2.5"
                opacity={0.55}
              />
              {coilPeriod > 0 && (
                <ellipse
                  cx={x}
                  cy={COIL_CY}
                  rx={COIL_RX}
                  ry={COIL_RY}
                  pathLength="100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="pulse"
                  style={{
                    animationDuration: `${coilPeriod}s`,
                    animationDelay: `${(-k / TURNS) * coilPeriod}s`,
                  }}
                />
              )}
            </g>
          ))}
        </g>
        {/* Leads from the 5 A supply to both ends of the coil. */}
        <Wire
          className={amber}
          period={coilPeriod}
          d={`M132 104 L168 104 L168 ${COIL_CY} L${COIL_X0 - COIL_RX} ${COIL_CY}`}
        />
        <Wire
          className={amber}
          period={coilPeriod}
          delayFraction={0.5}
          d={`M${coilX1} ${COIL_CY + COIL_RY} L${coilX1} 322 L168 322 L168 126 L132 126`}
        />

        {/* ---- B field inside the coil ----------------------------------- */}
        <g
          className="stroke-emerald-600 dark:stroke-emerald-400"
          strokeWidth="1.6"
          markerEnd="url(#lab1-arrow-b)"
          opacity={0.5}
        >
          {[-24, 24].map((dy) => (
            <line
              key={dy}
              x1={COIL_X0 + 8}
              y1={COIL_CY + dy}
              x2={coilX1 - 8}
              y2={COIL_CY + dy}
            />
          ))}
        </g>
        <text
          x={COIL_X0 + 4}
          y={COIL_CY - COIL_RY - 8}
          className="lbl fill-emerald-700 dark:fill-emerald-400"
        >
          {labels.fieldB}
        </text>
        <text
          x={coilX1}
          y={COIL_CY + COIL_RY + 20}
          textAnchor="end"
          className="lbl fill-amber-700 dark:fill-amber-400"
        >
          {labels.solenoid}
        </text>

        {/* ---- Conductor loop -------------------------------------------- */}
        {/* Halo in the page colour so the loop reads in front of the coil. */}
        <path
          d={loopPath}
          className="stroke-zinc-50 dark:stroke-zinc-950"
          fill="none"
          strokeWidth="9"
        />
        <Wire
          className={sky}
          period={loopPeriod}
          delayFraction={0.5}
          d={loopPath}
        />
        {/* The loop circuit, in series (guía §2.2): the 20 A supply feeds
            CASSY input B, which passes the current on to the loop, and the
            loop returns it to the supply. Input B measures current, so it
            sits in the circuit with two leads rather than probing it. */}
        <Wire
          className={sky}
          period={loopPeriod}
          d={`M132 30 L152 30 L152 10 L578 10 L578 56 L600 56`}
        />
        <Wire
          className={sky}
          period={loopPeriod}
          delayFraction={0.25}
          d={`M600 74 L588 74 L588 ${FEED_Y} L${LOOP_X + LOOP_HALF_W} ${FEED_Y}`}
        />
        <Wire
          className={sky}
          period={loopPeriod}
          delayFraction={0.75}
          d={`M${LOOP_X - LOOP_HALF_W} ${FEED_Y} L246 ${FEED_Y} L246 52 L132 52`}
        />
        {/* Loop length tick. */}
        <path
          d={`M${LOOP_X - LOOP_HALF_W} ${loopBottom + 10} L${LOOP_X + LOOP_HALF_W} ${loopBottom + 10}`}
          className="stroke-sky-600 dark:stroke-sky-400"
          strokeWidth="1.2"
        />
        <text
          x={LOOP_X}
          y={COIL_CY + COIL_RY + 20}
          textAnchor="middle"
          className="lbl fill-sky-700 dark:fill-sky-400"
        >
          {labels.loop} · l = {LOOP_LENGTH_M * 100} cm
        </text>

        {/* ---- Force on the loop ----------------------------------------- */}
        <line
          x1={LOOP_X}
          y1={loopBottom - 4}
          x2={LOOP_X}
          y2={loopBottom - 4 - arrowLen}
          className="stroke-rose-600 dark:stroke-rose-400"
          strokeWidth="3"
          markerEnd="url(#lab1-arrow-f)"
        />
        <text
          x={LOOP_X - 24}
          y={loopBottom - 6 - arrowLen}
          textAnchor="end"
          className="lbl fill-rose-700 dark:fill-rose-400"
        >
          {labels.forceF}
        </text>
      </svg>

      <div className="flex flex-wrap items-center gap-2">
        <Chip
          label={labels.loopCurrent}
          value={`${loopCurrentA.toFixed(2)} A`}
          tone="text-sky-700 dark:text-sky-400"
        />
        <Chip
          label={labels.coilCurrent}
          value={`${COIL_CURRENT_A.toFixed(2)} A`}
          tone="text-amber-700 dark:text-amber-400"
        />
        <Chip
          label={labels.fieldB}
          value={`${fieldMt.toFixed(2)} mT`}
          tone="text-emerald-700 dark:text-emerald-400"
        />
        <Chip
          label={labels.forceF}
          value={`${forceMn.toFixed(2)} mN`}
          tone="text-rose-700 dark:text-rose-400"
        />
        {replaying && (
          <Chip
            label={labels.elapsed}
            value={`${(sampleIndex * ESCALON_DT_S).toFixed(3)} s`}
            tone="text-zinc-500 dark:text-zinc-400"
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {playing ? labels.pause : labels.play}
        </button>
        {!replaying && (
          <label className="flex flex-1 items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
            {labels.loopCurrent}
            <input
              type="range"
              min={0}
              max={MAX_MANUAL_CURRENT_A}
              step={0.5}
              value={manualCurrent}
              onChange={(e) => setManualCurrent(Number(e.target.value))}
              className="min-w-32 flex-1"
            />
            <span className="w-14 text-right font-mono">
              {manualCurrent.toFixed(1)} A
            </span>
          </label>
        )}
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {replaying ? labels.replayHint : labels.manualHint}
      </p>
    </div>
  );
}
