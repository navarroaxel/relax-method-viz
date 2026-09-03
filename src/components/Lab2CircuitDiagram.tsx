"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { stepCurrentA, stepForceMn, STEP_DT_S } from "@/lib/lab2Escalon";
import {
  SEPARATION_M,
  UPPER_LENGTH_M,
  UPPER_LOOP_HEIGHT_M,
} from "@/lib/lab2Geometria";
import { rampCurrentA, rampForceMn } from "@/lib/lab2Rampa";

export interface Lab2CircuitLabels {
  supply: string;
  unit30: string;
  cassy: string;
  bridge: string;
  forceSensor: string;
  supportTop: string;
  supportBottom: string;
  upperLoop: string;
  lowerLoop: string;
  current: string;
  forceF: string;
  separation: string;
  upperHeight: string;
  speed: string;
  playStep: string;
  playRamp: string;
  pause: string;
  replayStepHint: string;
  replayRampHint: string;
  manualHint: string;
  elapsed: string;
  sample: string;
  load: string;
}

interface Lab2CircuitDiagramProps {
  labels: Lab2CircuitLabels;
  /** Slope a of F = a·I², in mN/A² — predicts F while the slider is driving. */
  slopeMnPerA2: number;
  /** Force at the top of the range, in mN, used to normalise the arrow. */
  referenceForceMn: number;
}

/** Top of the current range the loop can take (guía §3.2 c). */
const MAX_MANUAL_CURRENT_A = 20;

// --- Bench geometry, in user units ------------------------------------------
const LOOP_X = 300;
const HALF_W = 74;
const SENSOR_BOTTOM = 158;
/**
 * The three horizontal conductors, top to bottom. Vertically these are not to
 * scale — r is 3 mm against the suspended loop's own height of 58 mm, so
 * drawing it true would leave no room for the force arrow that belongs in
 * that gap. The dimension stack carries the real figures.
 */
const Y_RET_UP = 176;
const Y_ACTIVE = 236;
const Y_LOWER = 282;
/** x of the lead feeding the suspended loop, just outside its right leg. */
const FEED_UP_X = LOOP_X + HALF_W + 10;
/** x of the lead feeding the holder conductor, on its right end. */
const FEED_LOW_X = LOOP_X + HALF_W + 36;
const BASE_Y = 366;
/**
 * x of the height-adjustable holder's post — the middle of the lower
 * conductor's visible span, since the post supports the rod, not its feed
 * lead.
 */
const HOLDER_X = (FEED_LOW_X + (LOOP_X - HALF_W)) / 2;
/** x of the lead running between the two loops, clear of the holder post. */
const LINK_X = 462;
/** x of the dimension stack, clear of every lead. */
const DIM_X = 556;

export type Lab2Capture = "escalon" | "barrido";

/**
 * The two captures the bench can replay.
 *
 * Only the escalón has a real time base — the sweep sheet has no time column,
 * so it is walked at a nominal sample rate and its readout counts samples
 * rather than pretending to seconds.
 */
const CAPTURES: Record<
  Lab2Capture,
  {
    force: Float64Array;
    current: Float64Array;
    dtS: number;
    rates: readonly number[];
    timeBase: "seconds" | "samples";
  }
> = {
  escalon: {
    force: stepForceMn,
    current: stepCurrentA,
    dtS: STEP_DT_S,
    // The whole transient is over in a few tenths of a second: slow it down.
    rates: [1, 0.25, 0.1],
    timeBase: "seconds",
  },
  barrido: {
    force: rampForceMn,
    current: rampCurrentA,
    dtS: 0.02,
    rates: [1, 2, 4],
    timeBase: "samples",
  },
};

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
 * path declares pathLength="100", so one pulse crosses any segment in the same
 * time regardless of its real length — the pulses stay in step around the
 * series circuit.
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

/** Dimension line between two conductors, with its symbol alongside. */
function Dim({
  y1,
  y2,
  x,
  text,
}: {
  y1: number;
  y2: number;
  x: number;
  text: string;
}) {
  return (
    <g>
      <line
        x1={x}
        y1={y1}
        x2={x}
        y2={y2}
        strokeWidth={1}
        className="stroke-violet-600 dark:stroke-violet-400"
        markerStart="url(#lab2c-tick)"
        markerEnd="url(#lab2c-tick)"
      />
      <text
        x={x + 6}
        y={(y1 + y2) / 2 + 4}
        className="lbl fill-violet-700 dark:fill-violet-400"
      >
        {text}
      </text>
    </g>
  );
}

/**
 * The bench of figure 2.1, wired and running.
 *
 * One current in series through everything, which is the fact the whole
 * experiment rests on: the same I appears twice in F = μ₀I²l/2πr because the
 * two conductors are the same circuit. The pulses show it — there is a single
 * loop of charge, not two independent ones.
 *
 * The three horizontal conductors are drawn in the same top-to-bottom order as
 * the cross-section further up the page, and the current directions are drawn
 * true: the two facing conductors run the same way (they attract), while the
 * suspended loop's own return runs the other way (it pushes back). The lower
 * conductor is a single straight rod — current enters on one side and leaves
 * on the other, with no nearby return to answer back. Replaying a capture
 * drives the force readout and the arrow from the recorded samples rather
 * than from the formula.
 */
export function Lab2CircuitDiagram({
  labels,
  slopeMnPerA2,
  referenceForceMn,
}: Lab2CircuitDiagramProps) {
  const reducedMotion = useReducedMotion();
  const [capture, setCapture] = useState<Lab2Capture | null>(null);
  const [sampleIndex, setSampleIndex] = useState<number | null>(null);
  const [manualCurrent, setManualCurrent] = useState(12);
  const [speed, setSpeed] = useState<number>(1);
  const rafRef = useRef<number | null>(null);
  /** Position within the capture, in capture-milliseconds. */
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (!capture) return;
    const { force, dtS } = CAPTURES[capture];
    const total = force.length * dtS * 1000;
    // Resume from wherever the capture was, so changing rate mid-replay
    // re-times the playback instead of jumping back to the start.
    const base = elapsedRef.current;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = (base + (now - start) * speed) % total;
      elapsedRef.current = elapsed;
      setSampleIndex(Math.floor(elapsed / (dtS * 1000)));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [capture, speed]);

  const togglePlay = useCallback((which: Lab2Capture) => {
    setSampleIndex(null);
    elapsedRef.current = 0;
    // Rate sets differ per capture, so never carry one over.
    setSpeed(1);
    setCapture((active) => (active === which ? null : which));
  }, []);

  const replaying = capture !== null && sampleIndex !== null;
  const active = capture ? CAPTURES[capture] : null;
  const currentA =
    replaying && active ? (active.current[sampleIndex] ?? 0) : manualCurrent;
  // Manual mode predicts F from the fitted slope; playback shows what the
  // sensor actually reported, overshoot and all.
  const forceMn =
    replaying && active
      ? (active.force[sampleIndex] ?? 0)
      : slopeMnPerA2 * manualCurrent * manualCurrent;

  const load = Math.max(0, Math.min(forceMn / referenceForceMn, 1.2));
  const arrowLen = 8 + load * 42;

  // In slow motion the charge carriers should crawl too, otherwise the pulses
  // race across a bench that is otherwise frozen.
  const timeScale = replaying ? speed : 1;
  const period = reducedMotion ? 0 : pulsePeriod(currentA) / timeScale;

  // The loop is drawn fixed rather than sagging under load: r is set with the
  // height screw and held there, the sensor's own travel is microscopic, and a
  // gap that visibly shrank while its dimension still read 3.00 mm would say
  // something false. The arrow and the load bar carry the force instead.

  const sky = "stroke-sky-600 dark:stroke-sky-400";
  const grey = "stroke-zinc-400 dark:stroke-zinc-500";

  // Suspended loop, traced the way the current runs: down the feed lead, left
  // along the weighed conductor, up the far leg, back right along the return.
  const upperLoopPath =
    `M${FEED_UP_X} ${SENSOR_BOTTOM} L${FEED_UP_X} ${Y_ACTIVE} ` +
    `L${LOOP_X - HALF_W} ${Y_ACTIVE} L${LOOP_X - HALF_W} ${Y_RET_UP} ` +
    `L${LOOP_X + HALF_W} ${Y_RET_UP} L${LOOP_X + HALF_W} ${SENSOR_BOTTOM}`;

  // Holder conductor: a single straight rod, not a loop. Fed on the right, it
  // runs the same way as the suspended loop's facing side above it — that is
  // what makes the pair attract — then leaves on the left and is routed away,
  // clear of the interaction zone, back to the supply. It never doubles back
  // near itself, so there is no return side to draw here.
  const lowerWirePath =
    `M${FEED_LOW_X} ${Y_LOWER} L${LOOP_X - HALF_W} ${Y_LOWER} ` +
    `L${LOOP_X - HALF_W} ${BASE_Y + 14} L128 ${BASE_Y + 14} L128 60`;

  return (
    <div className="flex flex-col gap-2">
      <svg
        viewBox="0 0 720 400"
        role="img"
        aria-label={`${labels.upperLoop} — ${labels.lowerLoop}`}
        className="w-full rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950"
      >
        <style>{`
          .pulse {
            stroke-dasharray: 7 93;
            animation-name: lab2-pulse;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }
          @keyframes lab2-pulse { to { stroke-dashoffset: -100; } }
          @media (prefers-reduced-motion: reduce) { .pulse { animation: none; } }
          .lbl { font: 11px ui-sans-serif, system-ui, sans-serif; }
        `}</style>
        <defs>
          <marker
            id="lab2c-arrow-f"
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
          <marker
            id="lab2c-tick"
            viewBox="0 0 8 8"
            refX="4"
            refY="4"
            markerWidth="8"
            markerHeight="8"
            orient="auto"
          >
            <line
              x1="0"
              y1="4"
              x2="8"
              y2="4"
              strokeWidth="1.4"
              className="stroke-violet-600 dark:stroke-violet-400"
            />
          </marker>
        </defs>

        {/* ---- Instrument boxes ------------------------------------------ */}
        <g className="fill-white stroke-zinc-400 dark:fill-zinc-900 dark:stroke-zinc-600">
          <rect x="16" y="26" width="112" height="48" rx="4" />
          <rect x="152" y="26" width="88" height="48" rx="4" />
          <rect x="596" y="26" width="106" height="92" rx="4" />
          <rect x="474" y="122" width="84" height="30" rx="4" />
          <rect x={LOOP_X - 56} y="116" width="112" height="42" rx="4" />
        </g>

        <g className="lbl fill-zinc-700 dark:fill-zinc-200">
          <text x="72" y="46" textAnchor="middle">
            {labels.supply}
          </text>
          <text
            x="72"
            y="62"
            textAnchor="middle"
            className="fill-zinc-500 dark:fill-zinc-400"
          >
            {currentA.toFixed(2)} A
          </text>
          <text x="196" y="54" textAnchor="middle">
            {labels.unit30}
          </text>
          <text x="649" y="46" textAnchor="middle">
            {labels.cassy}
          </text>
          <text
            x="649"
            y="64"
            textAnchor="middle"
            className="fill-zinc-500 dark:fill-zinc-400"
          >
            A: F · B: I
          </text>
          <text
            x="649"
            y="84"
            textAnchor="middle"
            className="fill-rose-700 font-mono dark:fill-rose-400"
          >
            {labels.forceF} = {forceMn.toFixed(2)} mN
          </text>
          <text
            x="649"
            y="102"
            textAnchor="middle"
            className="fill-sky-700 font-mono dark:fill-sky-400"
          >
            I = {currentA.toFixed(2)} A
          </text>
          <text x="516" y="141" textAnchor="middle">
            {labels.bridge}
          </text>
          <text x={LOOP_X} y="134" textAnchor="middle">
            {labels.forceSensor}
          </text>
          <text
            x={LOOP_X}
            y="28"
            textAnchor="middle"
            className="fill-zinc-500 dark:fill-zinc-400"
          >
            {labels.supportTop}
          </text>
        </g>

        {/* Load bar inside the sensor body: how much of the top of the range
            the sensor is carrying right now. */}
        <g>
          <rect
            x={LOOP_X - 44}
            y="142"
            width="88"
            height="7"
            rx="3.5"
            className="fill-zinc-200 dark:fill-zinc-800"
          />
          <rect
            x={LOOP_X - 44}
            y="142"
            width={88 * Math.min(load, 1)}
            height="7"
            rx="3.5"
            className="fill-rose-500 dark:fill-rose-400"
          />
        </g>

        {/* Support structure holding the force sensor. */}
        <g className={grey} strokeWidth="4" fill="none">
          <path d={`M${LOOP_X} 44 L${LOOP_X} 116`} />
          <path d={`M${LOOP_X - 74} 44 L${LOOP_X + 74} 44`} />
        </g>

        {/* Height-adjustable holder carrying the lower conductor, planted
            under its middle rather than under either feed lead. */}
        <g className={grey} strokeWidth="4" fill="none">
          <path d={`M${HOLDER_X} ${Y_LOWER} L${HOLDER_X} ${BASE_Y}`} />
          <path
            d={`M${HOLDER_X - 48} ${BASE_Y} L${HOLDER_X + 48} ${BASE_Y}`}
          />
        </g>
        {/* Knob of the height adjustment — the control that sets r. */}
        <circle
          cx={HOLDER_X}
          cy={BASE_Y - 26}
          r="7"
          className="fill-white stroke-zinc-400 dark:fill-zinc-900 dark:stroke-zinc-600"
          strokeWidth="2"
        />
        <text
          x={HOLDER_X + 15}
          y={BASE_Y - 22}
          className="lbl fill-zinc-500 dark:fill-zinc-400"
        >
          {labels.supportBottom}
        </text>

        {/* Sensor signal cable: force sensor → Bridge unit → CASSY input A.
            Thin and grey because it carries no experiment current. */}
        <g className={grey} fill="none" strokeWidth="1.6">
          <path d={`M${LOOP_X + 56} 137 L474 137`} />
          <path d="M558 137 L576 137 L576 96 L596 96" />
        </g>

        {/* ---- The series circuit ---------------------------------------- */}
        {/* Supply → 30 A unit → CASSY input B. Input B measures current, so it
            sits in the circuit with two leads rather than probing it. */}
        <Wire className={sky} period={period} d="M128 44 L152 44" />
        <Wire
          className={sky}
          period={period}
          delayFraction={0.1}
          d="M240 40 L262 40 L262 10 L578 10 L578 40 L596 40"
        />
        {/* CASSY B out → the suspended loop's feed lead. */}
        <Wire
          className={sky}
          period={period}
          delayFraction={0.2}
          d={`M596 74 L570 74 L570 100 L${FEED_UP_X} 100 L${FEED_UP_X} ${SENSOR_BOTTOM}`}
        />

        {/* Halo in the page colour so the loops read in front of the holder. */}
        <path
          d={upperLoopPath}
          className="stroke-zinc-50 dark:stroke-zinc-950"
          fill="none"
          strokeWidth="9"
        />
        <Wire
          className={sky}
          period={period}
          delayFraction={0.35}
          d={upperLoopPath}
        />

        {/* Suspended loop → holder conductor: the two are in series, so the
            same current runs through both. */}
        <Wire
          className={sky}
          period={period}
          delayFraction={0.55}
          d={`M${LOOP_X + HALF_W} ${SENSOR_BOTTOM} L${LOOP_X + HALF_W} 146 L${LINK_X} 146 L${LINK_X} ${Y_LOWER} L${FEED_LOW_X} ${Y_LOWER}`}
        />

        <path
          d={lowerWirePath}
          className="stroke-zinc-50 dark:stroke-zinc-950"
          fill="none"
          strokeWidth="9"
        />
        <Wire
          className={sky}
          period={period}
          delayFraction={0.75}
          d={lowerWirePath}
        />

        {/* ---- Dimensions ------------------------------------------------ */}
        <g>
          <Dim
            y1={Y_RET_UP}
            y2={Y_ACTIVE}
            x={DIM_X}
            text={`${labels.upperHeight} = ${(UPPER_LOOP_HEIGHT_M * 1000).toFixed(1)} mm`}
          />
          <Dim
            y1={Y_ACTIVE}
            y2={Y_LOWER}
            x={DIM_X}
            text={`${labels.separation} = ${(SEPARATION_M * 1000).toFixed(2)} mm`}
          />
        </g>

        {/* ---- Force on the weighed conductor ---------------------------- */}
        <line
          x1={LOOP_X}
          y1={Y_ACTIVE + 5}
          x2={LOOP_X}
          y2={Y_ACTIVE + 5 + arrowLen}
          className="stroke-rose-600 dark:stroke-rose-400"
          strokeWidth="3"
          markerEnd="url(#lab2c-arrow-f)"
        />
        <text
          x={LOOP_X - 14}
          y={Y_ACTIVE + 9 + arrowLen / 2}
          textAnchor="end"
          className="lbl fill-rose-700 dark:fill-rose-400"
        >
          {labels.forceF}
        </text>

        {/* Loop names sit inside the loops themselves — the only clear space
            left once the leads, the holder and the dimensions are placed. */}
        <g className="lbl fill-sky-700 dark:fill-sky-400" textAnchor="middle">
          <text x={LOOP_X} y={Y_RET_UP + 26}>
            {labels.upperLoop}
          </text>
          <text x={LOOP_X} y={Y_RET_UP + 42}>
            l = {(UPPER_LENGTH_M * 100).toFixed(1)} cm
          </text>
          <text x={LOOP_X} y={Y_LOWER + 20}>
            {labels.lowerLoop}
          </text>
        </g>
      </svg>

      <div className="flex flex-wrap items-center gap-2">
        <Chip
          label={labels.current}
          value={`${currentA.toFixed(2)} A`}
          tone="text-sky-700 dark:text-sky-400"
        />
        <Chip
          label={labels.forceF}
          value={`${forceMn.toFixed(2)} mN`}
          tone="text-rose-700 dark:text-rose-400"
        />
        <Chip
          label={labels.separation}
          value={`${(SEPARATION_M * 1000).toFixed(2)} mm`}
          tone="text-violet-700 dark:text-violet-400"
        />
        <Chip
          label={labels.load}
          value={`${(load * 100).toFixed(0)} %`}
          tone="text-zinc-500 dark:text-zinc-400"
        />
        {replaying && active && (
          <Chip
            label={
              active.timeBase === "seconds" ? labels.elapsed : labels.sample
            }
            value={
              active.timeBase === "seconds"
                ? `${(sampleIndex * active.dtS).toFixed(3)} s`
                : `${sampleIndex}`
            }
            tone="text-zinc-500 dark:text-zinc-400"
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => togglePlay("escalon")}
            aria-pressed={capture === "escalon"}
            className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {capture === "escalon" ? labels.pause : labels.playStep}
          </button>
          <button
            type="button"
            onClick={() => togglePlay("barrido")}
            aria-pressed={capture === "barrido"}
            className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {capture === "barrido" ? labels.pause : labels.playRamp}
          </button>
        </span>
        {replaying && active && (
          <span className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
            {labels.speed}
            {active.rates.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setSpeed(rate)}
                aria-pressed={speed === rate}
                className={
                  speed === rate
                    ? "rounded-md border border-sky-500 bg-sky-50 px-2 py-1 font-mono text-xs text-sky-800 dark:bg-sky-950 dark:text-sky-200"
                    : "rounded-md border border-zinc-300 px-2 py-1 font-mono text-xs hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
                }
              >
                {rate}×
              </button>
            ))}
          </span>
        )}
        {!replaying && (
          <label className="flex flex-1 items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
            {labels.current}
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
        {capture === "escalon"
          ? labels.replayStepHint
          : capture === "barrido"
            ? labels.replayRampHint
            : labels.manualHint}
      </p>
    </div>
  );
}
