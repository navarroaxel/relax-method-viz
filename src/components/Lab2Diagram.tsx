"use client";

import { useId, useMemo } from "react";

import {
  geometryFactor,
  LOWER_LOOP_HEIGHT_M,
  SEPARATION_M,
  UPPER_LOOP_HEIGHT_M,
} from "@/lib/lab2Geometria";

export interface Lab2DiagramLabels {
  /** Label on the wire the sensor actually weighs. */
  activeWire: string;
  /** Label on the suspended loop's return side. */
  returnWire: string;
  /** Symbol used for the suspended loop's height, e.g. "h₁". */
  upperHeight: string;
  /** Symbol used for the holder loop's height, e.g. "h₂". */
  lowerHeight: string;
  attract: string;
  repel: string;
  /** Caption under the "what the guide models" panel. */
  idealCaption: string;
  /** Caption under the "what the bench has" panel. */
  realCaption: string;
  /** Legend for the shortfall readout, e.g. "Fuerza que sobrevive". */
  survives: string;
}

interface Lab2DiagramProps {
  labels: Lab2DiagramLabels;
  /** Separation r, in metres. Defaults to the measured value. */
  separationM?: number;
}

const WIRE_X1 = 92;
const WIRE_X2 = 250;
const WIRE_MID = (WIRE_X1 + WIRE_X2) / 2;

// Vertical positions are hand-placed, not scaled: r is 3 mm while the loop
// heights are 20 and 58 mm, so a true-to-scale drawing would put the return
// conductors off the page and hide the very geometry this is meant to show.
const Y_UPPER_RETURN = 44;
const Y_ACTIVE = 116;
const Y_FACING = 144;
const Y_LOWER_RETURN = 208;

const WIRE_CLASS =
  "stroke-sky-700 dark:stroke-sky-400 text-sky-700 dark:text-sky-400";
const RETURN_CLASS =
  "stroke-zinc-400 dark:stroke-zinc-500 text-zinc-400 dark:text-zinc-500";
const DIM_CLASS = "stroke-violet-600 dark:stroke-violet-400";
const DIM_TEXT_CLASS = "fill-violet-700 dark:fill-violet-400";
const LABEL_CLASS = "fill-zinc-600 dark:fill-zinc-300";

/**
 * Wire seen end-on, with the current-direction glyph: ⊙ out of the page,
 * ⊗ into it. The two loops each carry I out along one side and back along
 * the other, which is exactly why the return sides push the wrong way.
 */
function Wire({
  y,
  className,
  dir,
}: {
  y: number;
  className: string;
  dir: "in" | "out";
}) {
  return (
    <g className={className}>
      <line
        x1={WIRE_X1}
        y1={y}
        x2={WIRE_X2}
        y2={y}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <circle
        cx={WIRE_MID}
        cy={y}
        r={7}
        strokeWidth={2}
        className="fill-zinc-50 dark:fill-zinc-950"
      />
      {dir === "in" ? (
        <>
          <line
            x1={WIRE_MID - 4}
            y1={y - 4}
            x2={WIRE_MID + 4}
            y2={y + 4}
            strokeWidth={1.6}
          />
          <line
            x1={WIRE_MID - 4}
            y1={y + 4}
            x2={WIRE_MID + 4}
            y2={y - 4}
            strokeWidth={1.6}
          />
        </>
      ) : (
        <circle cx={WIRE_MID} cy={y} r={2.3} className="fill-current" />
      )}
    </g>
  );
}

/** Dimension line between two heights, with its symbol alongside. */
function Dim({
  y1,
  y2,
  x,
  text,
  uid,
}: {
  y1: number;
  y2: number;
  x: number;
  text: string;
  uid: string;
}) {
  return (
    <g>
      <line
        x1={x}
        y1={y1}
        x2={x}
        y2={y2}
        strokeWidth={1}
        className={DIM_CLASS}
        markerStart={`url(#${uid}-tick)`}
        markerEnd={`url(#${uid}-tick)`}
      />
      <text
        x={x + 6}
        y={(y1 + y2) / 2 + 4}
        fontSize={11}
        fontFamily="ui-monospace, monospace"
        className={DIM_TEXT_CLASS}
      >
        {text}
      </text>
    </g>
  );
}

/** Force arrow on one wire: `up` points away from the facing conductor. */
function Force({
  x,
  y,
  up,
  attract,
  uid,
  len = 20,
}: {
  x: number;
  y: number;
  up: boolean;
  attract: boolean;
  uid: string;
  /** Arrow length in user units — shortened where two arrows face each other. */
  len?: number;
}) {
  return (
    <line
      x1={x}
      y1={y}
      x2={x}
      y2={up ? y - len : y + len}
      strokeWidth={2.4}
      className={
        attract
          ? "stroke-emerald-600 dark:stroke-emerald-400"
          : "stroke-amber-600 dark:stroke-amber-400"
      }
      markerEnd={`url(#${uid}-${attract ? "attract" : "repel"})`}
    />
  );
}

/**
 * Cross-section of the two models the report has to choose between: the
 * guide's pair of lone infinite wires on the left, and the four wires the
 * bench actually has once both loops are drawn in full on the right.
 *
 * They are not a small correction apart. The three extra pairs all act
 * against the one the guide counts, and the readout under the panels says how
 * much of the ideal force survives them — the number the guide's Nota asks
 * the report to judge.
 */
export function Lab2Diagram({
  labels,
  separationM = SEPARATION_M,
}: Lab2DiagramProps) {
  const uid = useId();
  const factor = useMemo(() => geometryFactor(separationM), [separationM]);

  return (
    <div className="flex flex-col gap-2">
      <svg
        viewBox="0 0 800 266"
        role="img"
        className="w-full rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950"
      >
        <defs>
          <marker
            id={`${uid}-attract`}
            viewBox="0 0 10 10"
            refX="7"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path
              d="M 0 0 L 10 5 L 0 10 z"
              className="fill-emerald-600 dark:fill-emerald-400"
            />
          </marker>
          <marker
            id={`${uid}-repel`}
            viewBox="0 0 10 10"
            refX="7"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path
              d="M 0 0 L 10 5 L 0 10 z"
              className="fill-amber-600 dark:fill-amber-400"
            />
          </marker>
          <marker
            id={`${uid}-tick`}
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
              className={DIM_CLASS}
            />
          </marker>
        </defs>

        {/* -------- left panel: two lone infinite wires, F = μ₀I²l/2πr ----- */}
        <g>
          <Wire y={Y_ACTIVE} className={WIRE_CLASS} dir="out" />
          <Wire y={Y_FACING} className={WIRE_CLASS} dir="out" />
          <Force
            x={WIRE_X1 + 26}
            y={Y_ACTIVE}
            up={false}
            attract
            uid={uid}
            len={11}
          />
          <Force x={WIRE_X1 + 26} y={Y_FACING} up attract uid={uid} len={11} />
          <Dim
            y1={Y_ACTIVE}
            y2={Y_FACING}
            x={WIRE_X2 + 14}
            text="r"
            uid={uid}
          />
          <text
            x={WIRE_X1}
            y={Y_ACTIVE - 16}
            fontSize={12}
            className={LABEL_CLASS}
          >
            I
          </text>
          <text
            x={WIRE_X1}
            y={Y_FACING + 26}
            fontSize={12}
            className={LABEL_CLASS}
          >
            I
          </text>
          <text
            x={WIRE_MID}
            y={250}
            fontSize={12}
            textAnchor="middle"
            className={LABEL_CLASS}
          >
            {labels.idealCaption}
          </text>
        </g>

        <line
          x1={360}
          y1={20}
          x2={360}
          y2={238}
          strokeWidth={1}
          strokeDasharray="4 4"
          className="stroke-zinc-300 dark:stroke-zinc-700"
        />

        {/* -------- right panel: four wires, two closed loops -------------- */}
        <g transform="translate(470, 0)">
          <Wire y={Y_UPPER_RETURN} className={RETURN_CLASS} dir="in" />
          <Wire y={Y_ACTIVE} className={WIRE_CLASS} dir="out" />
          <Wire y={Y_FACING} className={WIRE_CLASS} dir="out" />
          <Wire y={Y_LOWER_RETURN} className={RETURN_CLASS} dir="in" />

          {/* the one pair the guide counts... */}
          <Force x={WIRE_X1 + 20} y={Y_ACTIVE} up={false} attract uid={uid} />
          {/* ...the holder's return wire pushing the weighed one back up... */}
          <Force x={WIRE_X1 + 48} y={Y_ACTIVE} up attract={false} uid={uid} />
          {/* ...and the suspended loop's own return wire, pushed away too */}
          <Force
            x={WIRE_X1 + 76}
            y={Y_UPPER_RETURN}
            up
            attract={false}
            uid={uid}
          />

          <Dim
            y1={Y_ACTIVE}
            y2={Y_FACING}
            x={WIRE_X2 + 12}
            text="r"
            uid={uid}
          />
          <Dim
            y1={Y_UPPER_RETURN}
            y2={Y_ACTIVE}
            x={WIRE_X2 + 56}
            text={labels.upperHeight}
            uid={uid}
          />
          <Dim
            y1={Y_FACING}
            y2={Y_LOWER_RETURN}
            x={WIRE_X2 + 12}
            text={labels.lowerHeight}
            uid={uid}
          />

          <text
            x={WIRE_X1 - 8}
            y={Y_UPPER_RETURN + 4}
            fontSize={11}
            textAnchor="end"
            className={LABEL_CLASS}
          >
            {labels.returnWire}
          </text>
          <text
            x={WIRE_X1 - 8}
            y={Y_ACTIVE + 4}
            fontSize={11}
            textAnchor="end"
            className={LABEL_CLASS}
          >
            {labels.activeWire}
          </text>
          <text
            x={WIRE_MID}
            y={250}
            fontSize={12}
            textAnchor="middle"
            className={LABEL_CLASS}
          >
            {labels.realCaption}
          </text>
        </g>
      </svg>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-emerald-600 dark:bg-emerald-400" />
          {labels.attract}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-amber-600 dark:bg-amber-400" />
          {labels.repel}
        </span>
        <span className="font-mono">
          r = {(separationM * 1000).toFixed(2)} mm · {labels.upperHeight} ={" "}
          {(UPPER_LOOP_HEIGHT_M * 1000).toFixed(1)} mm · {labels.lowerHeight} ={" "}
          {(LOWER_LOOP_HEIGHT_M * 1000).toFixed(1)} mm
        </span>
        <span className="font-mono">
          {labels.survives}: {(factor.ratio * 100).toFixed(1)} %
        </span>
      </div>
    </div>
  );
}
