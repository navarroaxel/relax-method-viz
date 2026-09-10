"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { formatNum, niceTicks } from "@/lib/chartUtils";

export interface ErrorScatterPoint {
  currentA: number;
  fieldMt: number;
  errorMt: number;
}

interface Lab1ErrorScatterChartProps {
  points: ErrorScatterPoint[];
  meanFieldMt: number;
  xLabel: string;
  yLabel: string;
  pointLabel: string;
  meanLabel: string;
  hoverHint: string;
  /** Formats the hover readout for one point. */
  formatSample: (point: ErrorScatterPoint, index: number) => string;
}

interface Palette {
  bg: string;
  border: string;
  grid: string;
  label: string;
  cursor: string;
  point: string;
  errorBar: string;
  mean: string;
}

const LIGHT_PALETTE: Palette = {
  bg: "#f8fafc",
  border: "#cbd5e1",
  grid: "#e2e8f0",
  label: "#475569",
  cursor: "#0f172a",
  point: "#dc2626",
  errorBar: "#334155",
  mean: "#0C447C",
};

const DARK_PALETTE: Palette = {
  bg: "#0f0f12",
  border: "#3f3f46",
  grid: "#27272a",
  label: "#d4d4d8",
  cursor: "#e4e4e7",
  point: "#f87171",
  errorBar: "#94a3b8",
  mean: "#60a5fa",
};

const WIDTH = 720;
const HEIGHT = 340;
const MARGIN = { top: 22, right: 20, bottom: 40, left: 56 };
const CAP_HALF_WIDTH = 5;

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

function extentX(points: ErrorScatterPoint[]): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of points) {
    if (p.currentA < lo) lo = p.currentA;
    if (p.currentA > hi) hi = p.currentA;
  }
  if (!(hi > lo)) return [lo - 1, hi + 1];
  const pad = (hi - lo) * 0.06;
  return [lo - pad, hi + pad];
}

function extentY(points: ErrorScatterPoint[], meanFieldMt: number): [number, number] {
  let lo = meanFieldMt;
  let hi = meanFieldMt;
  for (const p of points) {
    const upper = p.fieldMt + p.errorMt;
    const lower = p.fieldMt - p.errorMt;
    if (lower < lo) lo = lower;
    if (upper > hi) hi = upper;
  }
  if (!(hi > lo)) return [lo - 1, hi + 1];
  const pad = (hi - lo) * 0.1;
  return [lo - pad, hi + pad];
}

/**
 * Scatter of B vs I with a vertical error bar (± ΔB) per point and a
 * horizontal line at the mean field — the same layout as the professor's
 * worked example (ensayo1.pdf): red dots for B, capped bars for the
 * per-point tolerance band, and a reference line for the average.
 */
export function Lab1ErrorScatterChart({
  points,
  meanFieldMt,
  xLabel,
  yLabel,
  pointLabel,
  meanLabel,
  hoverHint,
  formatSample,
}: Lab1ErrorScatterChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDark = useIsDarkMode();
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const plotW = WIDTH - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;

  const clampIndex = useCallback(
    (i: number) => Math.min(points.length - 1, Math.max(0, i)),
    [points.length],
  );

  // Keyboard equivalent of hovering: a single focusable proxy sitting over
  // the canvas (role="slider" — one roving stop over the point list) so
  // ArrowLeft/ArrowRight walk the same hoverIndex the pointer already
  // drives.
  const handleProxyKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      if (points.length === 0) return;
      setHoverIndex((prev) =>
        prev === null
          ? 0
          : clampIndex(prev + (e.key === "ArrowRight" ? 1 : -1)),
      );
    },
    [clampIndex, points.length],
  );

  const handleProxyFocus = useCallback(() => {
    setHoverIndex((prev) => prev ?? (points.length > 0 ? 0 : null));
  }, [points.length]);

  const handleMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * WIDTH;
      const py = ((e.clientY - rect.top) / rect.height) * HEIGHT;
      const [xLo, xHi] = extentX(points);
      const [yLo, yHi] = extentY(points, meanFieldMt);
      let best = -1;
      let bestD = Infinity;
      points.forEach((p, k) => {
        const sx = MARGIN.left + ((p.currentA - xLo) / (xHi - xLo)) * plotW;
        const sy = MARGIN.top + plotH - ((p.fieldMt - yLo) / (yHi - yLo)) * plotH;
        const d = (sx - px) * (sx - px) + (sy - py) * (sy - py);
        if (d < bestD) {
          bestD = d;
          best = k;
        }
      });
      setHoverIndex(bestD < 900 ? best : null);
    },
    [meanFieldMt, plotH, plotW, points],
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

    const [xLo, xHi] = extentX(points);
    const [yLo, yHi] = extentY(points, meanFieldMt);
    const sx = (v: number) => MARGIN.left + ((v - xLo) / (xHi - xLo)) * plotW;
    const sy = (v: number) =>
      MARGIN.top + plotH - ((v - yLo) / (yHi - yLo)) * plotH;

    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(MARGIN.left + 0.5, MARGIN.top + 0.5, plotW, plotH);
    ctx.font = "11px ui-sans-serif, system-ui, sans-serif";

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const v of niceTicks(xLo, xHi, 8)) {
      const x = sx(v);
      ctx.strokeStyle = palette.grid;
      ctx.beginPath();
      ctx.moveTo(x, MARGIN.top);
      ctx.lineTo(x, MARGIN.top + plotH);
      ctx.stroke();
      ctx.fillStyle = palette.label;
      ctx.fillText(formatNum(v), x, MARGIN.top + plotH + 6);
    }
    ctx.fillText(xLabel, MARGIN.left + plotW / 2, HEIGHT - 14);

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const v of niceTicks(yLo, yHi, 5)) {
      const y = sy(v);
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
    ctx.fillStyle = palette.label;
    ctx.fillText(yLabel, 4, 4);

    ctx.save();
    ctx.beginPath();
    ctx.rect(MARGIN.left, MARGIN.top, plotW, plotH);
    ctx.clip();

    // Mean field, as a dashed reference line across the whole plot.
    ctx.strokeStyle = palette.mean;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(sx(xLo), sy(meanFieldMt));
    ctx.lineTo(sx(xHi), sy(meanFieldMt));
    ctx.stroke();
    ctx.setLineDash([]);

    // Error bars: a vertical stem from B−ΔB to B+ΔB, with a short
    // horizontal cap at each end — the same band shown as bounds in the
    // table above.
    ctx.strokeStyle = palette.errorBar;
    ctx.lineWidth = 1.3;
    for (const p of points) {
      const px = sx(p.currentA);
      const yUpper = sy(p.fieldMt + p.errorMt);
      const yLower = sy(p.fieldMt - p.errorMt);
      ctx.beginPath();
      ctx.moveTo(px, yUpper);
      ctx.lineTo(px, yLower);
      ctx.moveTo(px - CAP_HALF_WIDTH, yUpper);
      ctx.lineTo(px + CAP_HALF_WIDTH, yUpper);
      ctx.moveTo(px - CAP_HALF_WIDTH, yLower);
      ctx.lineTo(px + CAP_HALF_WIDTH, yLower);
      ctx.stroke();
    }

    // The points themselves, on top of their own error bars.
    ctx.fillStyle = palette.point;
    for (const p of points) {
      ctx.beginPath();
      ctx.arc(sx(p.currentA), sy(p.fieldMt), 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Legend, top-left.
    let ly = MARGIN.top + 10;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = palette.point;
    ctx.beginPath();
    ctx.arc(MARGIN.left + 16, ly, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.label;
    ctx.fillText(pointLabel, MARGIN.left + 26, ly);
    ly += 15;
    ctx.strokeStyle = palette.mean;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(MARGIN.left + 10, ly);
    ctx.lineTo(MARGIN.left + 32, ly);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = palette.label;
    ctx.fillText(meanLabel, MARGIN.left + 38, ly);

    if (hoverIndex !== null) {
      const p = points[hoverIndex];
      if (p) {
        ctx.strokeStyle = palette.cursor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx(p.currentA), sy(p.fieldMt), 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, [hoverIndex, meanFieldMt, meanLabel, palette, plotH, plotW, pointLabel, points, xLabel, yLabel]);

  const readout =
    hoverIndex === null
      ? hoverHint
      : (() => {
          const p = points[hoverIndex];
          return p ? formatSample(p, hoverIndex) : hoverHint;
        })();

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "auto",
            aspectRatio: `${WIDTH} / ${HEIGHT}`,
          }}
          className="rounded-md border border-zinc-200 dark:border-zinc-700"
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverIndex(null)}
        />
        {/* Focusable keyboard proxy: pointer-events stay off so clicks and
            hover still reach the canvas underneath untouched, but Tab order
            and ArrowLeft/ArrowRight land here — the accessible name/value
            live on this element, not just an aria-live announcement. */}
        <div
          role="slider"
          tabIndex={0}
          aria-label={`${yLabel} vs ${xLabel}`}
          aria-valuemin={0}
          aria-valuemax={Math.max(0, points.length - 1)}
          aria-valuenow={hoverIndex ?? 0}
          aria-valuetext={readout}
          className="absolute inset-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          style={{ pointerEvents: "none" }}
          onFocus={handleProxyFocus}
          onKeyDown={handleProxyKeyDown}
        />
      </div>
      <p className="font-mono text-xs text-zinc-600 dark:text-zinc-300">
        {readout}
      </p>
    </div>
  );
}
