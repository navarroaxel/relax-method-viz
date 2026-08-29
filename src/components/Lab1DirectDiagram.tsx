"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ProbePosition } from "@/lib/lab1MedicionDirecta";

export interface DirectDiagramLabels {
  supply: string;
  coil: string;
  probe: string;
  meter: string;
  fieldB: string;
  positionCenter: string;
  positionEnd: string;
  positionOutside: string;
  positionTipTransversal: string;
  play: string;
  pause: string;
  prev: string;
  next: string;
  point: (n: number) => string;
}

interface Lab1DirectDiagramProps {
  labels: DirectDiagramLabels;
  fieldMt: Float64Array;
  positions: ProbePosition[];
  coilCurrentA: number;
  /**
   * Externally-driven point to show, e.g. from hovering the chart below —
   * takes over the display (and pauses the internal stepper) while non-null.
   */
  highlightIndex?: number | null;
}

const TURNS = 11;
const COIL_X0 = 230;
const COIL_DX = 16;
const COIL_CY = 110;
const COIL_RY = 34;
const COIL_RX = 8;
const COIL_X1 = COIL_X0 + (TURNS - 1) * COIL_DX;

const CENTER_TURN = Math.floor((TURNS - 1) / 2);
const CENTER_X = COIL_X0 + CENTER_TURN * COIL_DX;
const END_X = COIL_X0;
const OUTSIDE_X = COIL_X1 + 70;

/** x of the readout box's left edge — placed clear of the "outside" zone. */
const METER_X = 516;

const SUPPLY_X = 8;
const SUPPLY_W = 88;
const SUPPLY_H = 48;
// Centred on the coil's axis so the direct lead runs straight across.
const SUPPLY_Y = COIL_CY - SUPPLY_H / 2;
const SUPPLY_CX = SUPPLY_X + SUPPLY_W / 2;
/** y of the return lead's exit point — offset from centre to clear the direct lead. */
const SUPPLY_RETURN_Y = SUPPLY_Y + SUPPLY_H * 0.82;
/** y of the amber return lead's long horizontal run underneath the coil. */
const RETURN_LOOP_Y = 205;
/** y of the below-core probe site, between the winding and the return lead. */
const BELOW_CORE_Y = COIL_CY + COIL_RY + (RETURN_LOOP_Y - (COIL_CY + COIL_RY)) / 2;
/** Index of n=6 — the "outside" point drawn below the coil, not past its end. */
const BELOW_CORE_INDEX = 5;
/**
 * Index of n=3 — the largest-magnitude "outside" reading, right after the
 * two correctly-aligned tip points. Illustrates the other way to read ~0 at
 * the tip: not moved away at all, just turned 90° off the field.
 */
const TIP_TRANSVERSAL_INDEX = 2;

const PROBE_X: Record<ProbePosition, number> = {
  center: CENTER_X,
  end: END_X,
  outside: OUTSIDE_X,
};

/**
 * Rotation of the probe's sensitive axis, in degrees, at each position. The
 * probe stays parallel to the solenoid throughout — "outside" is 0°, same as
 * "center", not 90°: it reads ~0 there because there is no field to read
 * outside the core, not because it is pointed the wrong way.
 */
const PROBE_ROTATION: Record<ProbePosition, number> = {
  center: 0,
  end: 180,
  outside: 0,
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

/** Seconds per pulse lap: more current, faster flow (mirrors Lab1Diagram). */
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
 * A conductor: a solid stroke plus a short dash travelling along it, same
 * convention as {@link ../components/Lab1Diagram}'s Wire — every path
 * declares pathLength="100" so a pulse crosses any segment in the same time.
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

/**
 * The solenoid + Hall-probe half of "Medicion_directa": no loop, no force —
 * just the coil at a fixed current and a probe stepped through the 14
 * recorded points. Built on the same coil rendering as {@link Lab1Diagram},
 * but the probe (not a current-carrying loop) is what moves, and what
 * changes between points is as much *where* it sits as *how it is turned* —
 * the double-headed arrow is the probe's sensitive axis, and it only reads
 * the field component it points along.
 */
export function Lab1DirectDiagram({
  labels,
  fieldMt,
  positions,
  coilCurrentA,
  highlightIndex = null,
}: Lab1DirectDiagramProps) {
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const n = positions.length;

  useEffect(() => {
    if (!playing || reducedMotion || highlightIndex !== null) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % n);
    }, 900);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, reducedMotion, highlightIndex, n]);

  const step = useCallback(
    (delta: number) => {
      setPlaying(false);
      setIndex((i) => (i + delta + n) % n);
    },
    [n],
  );

  // Keyboard equivalent of the Prev/Next buttons: a focusable proxy sitting
  // over the (otherwise non-interactive) diagram so ArrowLeft/ArrowRight
  // step the same index those buttons drive, without having to tab past
  // them first. Reuses `step()` itself, so pausing playback and wrap-around
  // stay identical between the two input methods.
  const handleProxyKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      step(e.key === "ArrowRight" ? 1 : -1);
    },
    [step],
  );

  // A hovered point on the chart below takes over which point is shown.
  const effectiveIndex = highlightIndex ?? index;
  const linked = highlightIndex !== null;

  const position = positions[effectiveIndex] ?? "outside";
  const bMt = fieldMt[effectiveIndex] ?? 0;
  // n=6 (index 5) illustrates the other way to be "outside the core": still
  // parallel to the axis, but resting just beneath the winding rather than
  // past the coil's end — so it gets its own spot in the diagram instead of
  // sharing the axial "outside" zone.
  const isBelowCore = position === "outside" && effectiveIndex === BELOW_CORE_INDEX;
  // n=3 (index 2) illustrates yet another way to read ~0: still right at the
  // tip, not moved at all — just turned 90° off the axis it needs to align
  // with, so the sensitive axis picks up none of the field that's actually
  // there.
  const isTipTransversal =
    position === "outside" && effectiveIndex === TIP_TRANSVERSAL_INDEX;
  const probeX = isTipTransversal
    ? END_X
    : isBelowCore
      ? CENTER_X
      : PROBE_X[position];
  const probeY = isBelowCore ? BELOW_CORE_Y : COIL_CY;
  const rodFromY = isBelowCore ? COIL_CY + COIL_RY : 30;
  const rotation = isTipTransversal ? 90 : PROBE_ROTATION[position];
  const inserted = isTipTransversal ? true : isBelowCore ? false : position !== "outside";

  const positionLabel = isTipTransversal
    ? labels.positionTipTransversal
    : position === "center"
      ? labels.positionCenter
      : position === "end"
        ? labels.positionEnd
        : labels.positionOutside;

  const turns = Array.from({ length: TURNS }, (_, k) => COIL_X0 + k * COIL_DX);
  const coilPeriod = reducedMotion ? 0 : pulsePeriod(coilCurrentA);
  const amber = "stroke-amber-600 dark:stroke-amber-400";
  const violet = "stroke-violet-600 dark:stroke-violet-400";

  const valueText = `${labels.point(effectiveIndex + 1)} · ${positionLabel} · ${labels.fieldB} = ${bMt.toFixed(2)} mT`;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <svg
          viewBox="0 0 620 220"
          role="img"
          aria-label={`${labels.coil} — ${labels.probe}`}
          className="w-full rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950"
        >
        <style>{`
          .lbl { font: 11px ui-sans-serif, system-ui, sans-serif; }
          .pulse {
            stroke-dasharray: 7 93;
            animation-name: lab1-direct-pulse;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }
          @keyframes lab1-direct-pulse { to { stroke-dashoffset: -100; } }
          @media (prefers-reduced-motion: reduce) { .pulse { animation: none; } }
        `}</style>
        <defs>
          <marker
            id="lab1-direct-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path
              d="M0,0 L10,5 L0,10 z"
              className="fill-violet-600 dark:fill-violet-400"
            />
          </marker>
        </defs>

        {/* ---- Solenoid, held at a fixed current for this whole capture --- */}
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
        {/* Leads from the coil supply to both ends of the winding: the direct
            lead runs level with the coil's own axis, dead horizontal. */}
        <Wire
          className={amber}
          period={coilPeriod}
          d={`M${SUPPLY_X + SUPPLY_W} ${COIL_CY} L${COIL_X0 - COIL_RX} ${COIL_CY}`}
        />
        <Wire
          className={amber}
          period={coilPeriod}
          delayFraction={0.5}
          d={`M${COIL_X1 + COIL_RX} ${COIL_CY} L${COIL_X1 + 24} ${COIL_CY} L${COIL_X1 + 24} ${RETURN_LOOP_Y} L20 ${RETURN_LOOP_Y} L20 ${SUPPLY_RETURN_Y} L${SUPPLY_X} ${SUPPLY_RETURN_Y}`}
        />
        <g className="fill-white stroke-zinc-400 dark:fill-zinc-900 dark:stroke-zinc-600">
          <rect x={SUPPLY_X} y={SUPPLY_Y} width={SUPPLY_W} height={SUPPLY_H} rx="4" />
        </g>
        <g className="lbl fill-zinc-700 dark:fill-zinc-200">
          <text x={SUPPLY_CX} y={SUPPLY_Y + 20} textAnchor="middle">
            {labels.supply}
          </text>
          <text
            x={SUPPLY_CX}
            y={SUPPLY_Y + 36}
            textAnchor="middle"
            className="fill-zinc-500 dark:fill-zinc-400"
          >
            {coilCurrentA.toFixed(2)} A
          </text>
        </g>
        <text
          x={COIL_X0 + 4}
          y={COIL_CY - COIL_RY - 10}
          className="lbl fill-amber-700 dark:fill-amber-400"
        >
          {labels.coil}
        </text>

        {/* ---- Reference zones: always visible, so the diagram marks every
              site even while the stepper sits somewhere else. ------------- */}
        <g className="lbl" textAnchor="middle">
          {(
            [
              ["end", END_X, 20, position === "end" || isTipTransversal],
              ["center", CENTER_X, 20, position === "center"],
              [
                "outside",
                OUTSIDE_X,
                20,
                position === "outside" && !isBelowCore,
              ],
              [
                "outside",
                CENTER_X,
                BELOW_CORE_Y + 16,
                isBelowCore,
              ],
            ] as const
          ).map(([pos, x, y, active], i) => (
            <text
              key={i}
              x={x}
              y={y}
              className={
                active
                  ? "fill-violet-700 dark:fill-violet-300 font-semibold"
                  : "fill-zinc-400 dark:fill-zinc-600"
              }
            >
              {pos === "center"
                ? labels.positionCenter
                : pos === "end"
                  ? labels.positionEnd
                  : labels.positionOutside}
            </text>
          ))}
        </g>

        {/* ---- Probe: a rod through the slit (or up from underneath, for
              the below-core site), ending in a Hall tip ------------------- */}
        {inserted && (
          <path
            d={`M${probeX} ${rodFromY} L${probeX} ${probeY}`}
            className={violet}
            strokeWidth="2.5"
            fill="none"
          />
        )}
        {!inserted && (
          <path
            d={`M${probeX} ${rodFromY} L${probeX} ${probeY}`}
            className={violet}
            strokeWidth="2"
            strokeDasharray="3 4"
            fill="none"
            opacity={0.7}
          />
        )}
        {linked && (
          <circle
            cx={probeX}
            cy={probeY}
            r={11}
            className="animate-pulse fill-amber-400/25 stroke-amber-500 dark:fill-amber-300/20 dark:stroke-amber-300"
            strokeWidth="1.5"
          />
        )}
        <circle
          cx={probeX}
          cy={probeY}
          r={5}
          className={`${violet} fill-violet-100 dark:fill-violet-950`}
          strokeWidth="2"
        />
        {/* Sensitive axis: the probe only reads the field component it
            points along, which is the whole point of moving/turning it. */}
        <g transform={`rotate(${rotation} ${probeX} ${probeY})`}>
          <line
            x1={probeX - 22}
            y1={probeY}
            x2={probeX + 22}
            y2={probeY}
            className={violet}
            strokeWidth="2"
            markerEnd="url(#lab1-direct-arrow)"
            opacity={inserted ? 0.9 : 0.5}
          />
        </g>
        <text
          x={probeX}
          y={isBelowCore ? probeY + 26 : probeY - 12}
          textAnchor="middle"
          className="lbl fill-violet-700 dark:fill-violet-300"
        >
          {labels.probe}
        </text>

        {/* ---- Readout box ------------------------------------------------- */}
        <g className="fill-white stroke-zinc-400 dark:fill-zinc-900 dark:stroke-zinc-600">
          <rect x={METER_X} y="86" width="96" height="46" rx="4" />
        </g>
        <g className="lbl fill-zinc-700 dark:fill-zinc-200">
          <text x={METER_X + 48} y="102" textAnchor="middle">
            {labels.meter}
          </text>
          <text
            x={METER_X + 48}
            y="120"
            textAnchor="middle"
            className="font-mono fill-violet-700 dark:fill-violet-300"
          >
            {bMt.toFixed(2)} mT
          </text>
        </g>
        <path
          d={`M${probeX + 6} ${probeY} L${METER_X} 108`}
          className="stroke-zinc-400 dark:stroke-zinc-500"
          fill="none"
          strokeWidth="1.4"
          strokeDasharray="2 3"
        />
      </svg>
        {/* Focusable keyboard proxy: pointer-events stay off so the diagram
            underneath is untouched, but Tab order and ArrowLeft/ArrowRight
            land here — the accessible name/value live on this element,
            not just an aria-live region. */}
        <div
          role="slider"
          tabIndex={0}
          aria-label={`${labels.coil} — ${labels.probe}`}
          aria-valuemin={0}
          aria-valuemax={Math.max(0, n - 1)}
          aria-valuenow={effectiveIndex}
          aria-valuetext={valueText}
          className="absolute inset-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          style={{ pointerEvents: "none" }}
          onKeyDown={handleProxyKeyDown}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Chip
          label="n"
          value={labels.point(effectiveIndex + 1)}
          tone={
            linked
              ? "text-amber-700 dark:text-amber-400"
              : "text-zinc-500 dark:text-zinc-400"
          }
        />
        <Chip
          label={labels.probe}
          value={positionLabel}
          tone="text-violet-700 dark:text-violet-400"
        />
        <Chip
          label={labels.fieldB}
          value={`${bMt.toFixed(2)} mT`}
          tone="text-violet-700 dark:text-violet-400"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {labels.prev}
        </button>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-pressed={playing}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {playing ? labels.pause : labels.play}
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {labels.next}
        </button>
      </div>
    </div>
  );
}
