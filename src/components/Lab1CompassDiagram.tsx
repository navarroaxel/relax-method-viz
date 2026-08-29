"use client";

import { useEffect, useState } from "react";

export interface CompassDiagramLabels {
  coil: string;
  compass: string;
  positionFar: string;
  positionMouth: string;
  positionCenter: string;
  positionSide: string;
  farHint: string;
  mouthHint: string;
  centerHint: string;
  sideHint: string;
  north: string;
}

interface Lab1CompassDiagramProps {
  labels: CompassDiagramLabels;
  coilCurrentA: number;
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
const COMPASS_R = 20;

/**
 * Needle angle far from the coil, in degrees — an arbitrary tilt standing in
 * for Earth's field, whatever direction that happens to be relative to the
 * bench.
 */
const FAR_ANGLE_DEG = -70;

export type CompassPosition = "far" | "mouth" | "center" | "side";

/** y of the external return path, below the coil — where the "side" compass
 * sits and where the closed field-line loop passes on its way back. */
const LOOP_Y = COIL_CY + COIL_RY + 40;

/**
 * Where the compass sits, and what its needle does there — this is why the
 * needle's direction depends on *position*, not just distance: on-axis at
 * the coil's mouth the field keeps pointing the same way it does inside
 * (just weaker), but off to the side of the coil the external field loops
 * back the other way, like the field around a bar magnet. That reversal is
 * the point; only the far/mouth/side split is a simplification, not the
 * flip itself.
 */
const COMPASS_SITE: Record<
  CompassPosition,
  { x: number; y: number; angleDeg: number }
> = {
  far: { x: 560, y: COIL_CY, angleDeg: FAR_ANGLE_DEG },
  mouth: { x: COIL_X0 - 34, y: COIL_CY, angleDeg: 0 },
  center: { x: CENTER_X, y: COIL_CY, angleDeg: 0 },
  side: { x: CENTER_X, y: LOOP_Y, angleDeg: 180 },
};

/** Fixed on-page reference point for the Earth's-field direction arrow. */
const NORTH_X = 40;
const NORTH_Y = 60;
const NORTH_LEN = 34;

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

export function Lab1CompassDiagram({
  labels,
  coilCurrentA,
}: Lab1CompassDiagramProps) {
  const reducedMotion = useReducedMotion();
  const [position, setPosition] = useState<CompassPosition>("far");

  const site = COMPASS_SITE[position];
  const coilPeriod = reducedMotion ? 0 : pulsePeriod(coilCurrentA);

  const turns = Array.from({ length: TURNS }, (_, k) => COIL_X0 + k * COIL_DX);
  const amber = "stroke-amber-600 dark:stroke-amber-400";

  return (
    <div className="flex flex-col gap-2">
      <svg
        viewBox="0 0 620 220"
        role="img"
        aria-label={`${labels.coil} — ${labels.compass}`}
        className="w-full rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950"
      >
        <style>{`
          .lbl { font: 11px ui-sans-serif, system-ui, sans-serif; }
          .pulse {
            stroke-dasharray: 7 93;
            animation-name: lab1-compass-pulse;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }
          @keyframes lab1-compass-pulse { to { stroke-dashoffset: -100; } }
          @media (prefers-reduced-motion: reduce) { .pulse { animation: none; } }
          .needle { transition: transform 0.4s ease-out; }
          .compass-body { transition: transform 0.4s ease-out; }
        `}</style>
        <defs>
          <marker
            id="lab1-compass-north-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path
              d="M0,0 L10,5 L0,10 z"
              className="fill-zinc-500 dark:fill-zinc-400"
            />
          </marker>
          <marker
            id="lab1-compass-field-arrow"
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
        </defs>

        {/* ---- Fixed reference: Earth's field direction, wherever the
              bench happens to be pointing — the needle matches this far
              from the coil, and abandons it once the coil takes over. --- */}
        <g transform={`translate(${NORTH_X}, ${NORTH_Y}) rotate(${FAR_ANGLE_DEG})`}>
          <line
            x1={0}
            y1={0}
            x2={NORTH_LEN}
            y2={0}
            className="stroke-zinc-500 dark:stroke-zinc-400"
            strokeWidth="1.6"
            strokeDasharray="3 3"
            markerEnd="url(#lab1-compass-north-arrow)"
          />
        </g>
        <text
          x={NORTH_X + 14}
          y={NORTH_Y + 6}
          className="lbl fill-zinc-500 dark:fill-zinc-400"
        >
          {labels.north}
        </text>

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
        <text
          x={COIL_X0 + 4}
          y={COIL_CY - COIL_RY - 10}
          className="lbl fill-amber-700 dark:fill-amber-400"
        >
          {labels.coil}
        </text>

        {/* ---- Field lines: straight through the core, closing in a loop
              outside — same shape a bar magnet's field takes, and the
              reason the "side" reading points the other way. ------------ */}
        <g
          className="stroke-emerald-600 dark:stroke-emerald-400"
          strokeWidth="1.4"
          fill="none"
        >
          {[-16, 16].map((dy) => (
            <line
              key={dy}
              x1={COIL_X0 + 6}
              y1={COIL_CY + dy}
              x2={COIL_X1 - 6}
              y2={COIL_CY + dy}
              opacity={0.35}
            />
          ))}
          <line
            x1={COIL_X0 + 6}
            y1={COIL_CY}
            x2={COIL_X1 - 6}
            y2={COIL_CY}
            opacity={0.6}
            markerEnd="url(#lab1-compass-field-arrow)"
          />
          <path
            d={`M${COIL_X1 - 6} ${COIL_CY} C ${COIL_X1 + 30} ${COIL_CY}, ${COIL_X1 + 10} ${LOOP_Y}, ${CENTER_X} ${LOOP_Y} C ${COIL_X0 - 10} ${LOOP_Y}, ${COIL_X0 - 30} ${COIL_CY}, ${COIL_X0 + 6} ${COIL_CY}`}
            strokeDasharray="4 4"
            opacity={0.5}
          />
          <line
            x1={CENTER_X + 16}
            y1={LOOP_Y}
            x2={CENTER_X - 16}
            y2={LOOP_Y}
            opacity={0.8}
            markerEnd="url(#lab1-compass-field-arrow)"
          />
        </g>

        {/* ---- Compass: housing + a two-tone needle that snaps to the axis
              as it nears the solenoid's mouth. --------------------------- */}
        <g
          className="compass-body"
          style={{
            transform: `translate(${site.x}px, ${site.y}px)`,
            transformOrigin: `${site.x}px ${site.y}px`,
          }}
        >
          <circle
            r={COMPASS_R}
            className="fill-white stroke-zinc-400 dark:fill-zinc-900 dark:stroke-zinc-600"
            strokeWidth="2"
          />
          <g
            className="needle"
            style={{
              transform: `rotate(${site.angleDeg}deg)`,
              transformOrigin: "0px 0px",
            }}
          >
            <path
              d={`M0,0 L${-COMPASS_R + 4},0 L0,-3 Z`}
              className="fill-rose-600 dark:fill-rose-400"
            />
            <path
              d={`M0,0 L${COMPASS_R - 4},0 L0,3 Z`}
              className="fill-zinc-400 dark:fill-zinc-300"
            />
          </g>
          <text
            y={-COMPASS_R - 8}
            textAnchor="middle"
            className="lbl fill-zinc-700 dark:fill-zinc-200"
          >
            {labels.compass}
          </text>
        </g>
      </svg>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["far", labels.positionFar],
            ["mouth", labels.positionMouth],
            ["center", labels.positionCenter],
            ["side", labels.positionSide],
          ] as const
        ).map(([pos, label]) => (
          <button
            key={pos}
            type="button"
            onClick={() => setPosition(pos)}
            aria-pressed={position === pos}
            className={
              position === pos
                ? "rounded-md border border-sky-500 bg-sky-50 px-2 py-1 text-xs text-sky-800 dark:bg-sky-950 dark:text-sky-200"
                : "rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            }
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {position === "far"
          ? labels.farHint
          : position === "mouth"
            ? labels.mouthHint
            : position === "center"
              ? labels.centerHint
              : labels.sideHint}
      </p>
    </div>
  );
}
