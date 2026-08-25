"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { formatNum, niceTicks } from "@/lib/chartUtils";
import { ESCALON_DT_S } from "@/lib/lab1Escalon";

export interface ChartSeries {
  /** Samples, one per {@link ESCALON_DT_S}. */
  values: Float64Array;
  /** Which vertical axis this series is drawn against. */
  axis: "left" | "right";
  /** Legend / readout label, e.g. "F (mN)". */
  label: string;
  /** Palette key resolved per theme. */
  color: "force" | "current" | "field";
}

export interface ChartMarker {
  timeS: number;
  label: string;
  /** Dimmer style for supporting marks. */
  faint?: boolean;
}

export interface ChartBand {
  axis: "left" | "right";
  from: number;
  to: number;
  label: string;
}

interface Lab1ChartProps {
  series: ChartSeries[];
  leftLabel: string;
  rightLabel?: string;
  /** Forced left-axis range; auto-scaled from the data when omitted. */
  leftRange?: [number, number];
  rightRange?: [number, number];
  markers?: ChartMarker[];
  band?: ChartBand;
  showMarkers: boolean;
  timeLabel: string;
  hoverHint: string;
}

interface Palette {
  bg: string;
  border: string;
  grid: string;
  label: string;
  cursor: string;
  marker: string;
  markerFaint: string;
  band: string;
  force: string;
  current: string;
  field: string;
}

const LIGHT_PALETTE: Palette = {
  bg: "#f8fafc",
  border: "#cbd5e1",
  grid: "#e2e8f0",
  label: "#475569",
  cursor: "#0f172a",
  marker: "#7c3aed",
  markerFaint: "#c4b5fd",
  band: "rgba(16, 185, 129, 0.14)",
  force: "#0C447C",
  current: "#B45309",
  field: "#791F1F",
};

const DARK_PALETTE: Palette = {
  bg: "#0f0f12",
  border: "#3f3f46",
  grid: "#27272a",
  label: "#d4d4d8",
  cursor: "#e4e4e7",
  marker: "#a78bfa",
  markerFaint: "#5b21b6",
  band: "rgba(52, 211, 153, 0.16)",
  force: "#60a5fa",
  current: "#fbbf24",
  field: "#f87171",
};

const WIDTH = 720;
const HEIGHT = 300;
const MARGIN = { top: 22, right: 58, bottom: 38, left: 58 };

function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains("dark"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

function extent(values: Float64Array): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (let k = 0; k < values.length; k++) {
    const v = values[k] ?? 0;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (!(hi > lo)) return [lo - 1, hi + 1];
  const pad = (hi - lo) * 0.08;
  return [lo - pad, hi + pad];
}

function axisRange(
  series: ChartSeries[],
  axis: "left" | "right",
  forced: [number, number] | undefined,
): [number, number] {
  if (forced) return forced;
  const own = series.filter((s) => s.axis === axis);
  if (own.length === 0) return [0, 1];
  let lo = Infinity;
  let hi = -Infinity;
  for (const s of own) {
    const [a, b] = extent(s.values);
    lo = Math.min(lo, a);
    hi = Math.max(hi, b);
  }
  return [lo, hi];
}

export function Lab1Chart({
  series,
  leftLabel,
  rightLabel,
  leftRange,
  rightRange,
  markers = [],
  band,
  showMarkers,
  timeLabel,
  hoverHint,
}: Lab1ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDark = useIsDarkMode();
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const sampleCount = series[0]?.values.length ?? 0;
  const tMax = (sampleCount - 1) * ESCALON_DT_S;

  const plotW = WIDTH - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;

  const handleMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * WIDTH;
      const frac = (x - MARGIN.left) / plotW;
      if (frac < 0 || frac > 1) {
        setHoverIndex(null);
        return;
      }
      setHoverIndex(Math.round(frac * (sampleCount - 1)));
    },
    [plotW, sampleCount],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    if (canvas.width !== WIDTH * dpr || canvas.height !== HEIGHT * dpr) {
      canvas.width = WIDTH * dpr;
      canvas.height = HEIGHT * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    const [leftLo, leftHi] = axisRange(series, "left", leftRange);
    const [rightLo, rightHi] = axisRange(series, "right", rightRange);
    const xOf = (t: number) => MARGIN.left + (t / tMax) * plotW;
    const yLeft = (v: number) =>
      MARGIN.top + plotH - ((v - leftLo) / (leftHi - leftLo)) * plotH;
    const yRight = (v: number) =>
      MARGIN.top + plotH - ((v - rightLo) / (rightHi - rightLo)) * plotH;
    const yOf = (v: number, axis: "left" | "right") =>
      axis === "left" ? yLeft(v) : yRight(v);

    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(MARGIN.left + 0.5, MARGIN.top + 0.5, plotW, plotH);

    ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
    ctx.fillStyle = palette.label;

    // Tolerance band (drawn first so the traces sit on top).
    if (band && showMarkers) {
      const yA = yOf(band.to, band.axis);
      const yB = yOf(band.from, band.axis);
      ctx.fillStyle = palette.band;
      ctx.fillRect(MARGIN.left, yA, plotW, yB - yA);
      ctx.fillStyle = palette.label;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText(band.label, MARGIN.left + plotW - 4, yA - 2);
    }

    // Time grid + ticks.
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const t of niceTicks(0, tMax, 10)) {
      const x = xOf(t);
      ctx.strokeStyle = palette.grid;
      ctx.beginPath();
      ctx.moveTo(x, MARGIN.top);
      ctx.lineTo(x, MARGIN.top + plotH);
      ctx.stroke();
      ctx.fillStyle = palette.label;
      ctx.fillText(formatNum(t), x, MARGIN.top + plotH + 6);
    }
    ctx.fillText(timeLabel, MARGIN.left + plotW / 2, HEIGHT - 12);

    // Left axis.
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const v of niceTicks(leftLo, leftHi, 5)) {
      const y = yLeft(v);
      ctx.strokeStyle = palette.grid;
      ctx.beginPath();
      ctx.moveTo(MARGIN.left, y);
      ctx.lineTo(MARGIN.left + plotW, y);
      ctx.stroke();
      ctx.fillStyle = palette.label;
      ctx.fillText(formatNum(v), MARGIN.left - 6, y);
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(leftLabel, 4, 4);

    // Right axis (labels only — the grid belongs to the left axis).
    if (rightLabel) {
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      for (const v of niceTicks(rightLo, rightHi, 5)) {
        ctx.fillText(formatNum(v), MARGIN.left + plotW + 6, yRight(v));
      }
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.fillText(rightLabel, WIDTH - 4, 4);
    }

    // Event markers.
    if (showMarkers) {
      ctx.textBaseline = "top";
      // Markers cluster in the first fraction of a second, so stagger the
      // labels vertically instead of letting them overprint each other.
      markers.forEach((m, i) => {
        const x = xOf(m.timeS);
        const labelY = MARGIN.top + 2 + (i % 2) * 13;
        ctx.strokeStyle = m.faint ? palette.markerFaint : palette.marker;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x, MARGIN.top);
        ctx.lineTo(x, MARGIN.top + plotH);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = m.faint ? palette.markerFaint : palette.marker;
        ctx.textAlign = x > MARGIN.left + plotW * 0.85 ? "right" : "left";
        ctx.fillText(m.label, x + (ctx.textAlign === "right" ? -3 : 3), labelY);
      });
    }

    // Traces.
    ctx.lineWidth = 1.6;
    ctx.lineJoin = "round";
    for (const s of series) {
      ctx.strokeStyle = palette[s.color];
      ctx.beginPath();
      for (let k = 0; k < s.values.length; k++) {
        const x = xOf(k * ESCALON_DT_S);
        const y = yOf(s.values[k] ?? 0, s.axis);
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Hover cursor.
    if (hoverIndex !== null) {
      const x = xOf(hoverIndex * ESCALON_DT_S);
      ctx.strokeStyle = palette.cursor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, MARGIN.top);
      ctx.lineTo(x, MARGIN.top + plotH);
      ctx.stroke();
      for (const s of series) {
        ctx.fillStyle = palette[s.color];
        ctx.beginPath();
        ctx.arc(x, yOf(s.values[hoverIndex] ?? 0, s.axis), 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [
    band,
    hoverIndex,
    leftLabel,
    leftRange,
    markers,
    palette,
    plotH,
    plotW,
    rightLabel,
    rightRange,
    series,
    showMarkers,
    tMax,
    timeLabel,
  ]);

  const readout =
    hoverIndex === null
      ? hoverHint
      : `t = ${(hoverIndex * ESCALON_DT_S).toFixed(3)} s` +
        series
          .map((s) => `  ·  ${s.label} = ${(s.values[hoverIndex] ?? 0).toFixed(2)}`)
          .join("");

  return (
    <div className="flex flex-col gap-1">
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "auto", aspectRatio: `${WIDTH} / ${HEIGHT}` }}
        className="rounded-md border border-zinc-200 dark:border-zinc-700"
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIndex(null)}
      />
      <p className="font-mono text-xs text-zinc-600 dark:text-zinc-300">{readout}</p>
    </div>
  );
}
