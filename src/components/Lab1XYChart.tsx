"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { formatNum, niceTicks } from "@/lib/chartUtils";

export type XYTone = "rising" | "falling" | "overall";

export interface XYFitLine {
  slope: number;
  intercept: number;
  tone: XYTone;
  label: string;
}

interface Lab1XYChartProps {
  xs: Float64Array;
  ys: Float64Array;
  /** Sample where the sweep turns back: everything after it is the down leg. */
  splitIndex: number;
  lines: XYFitLine[];
  xLabel: string;
  yLabel: string;
  risingLabel: string;
  fallingLabel: string;
  hoverHint: string;
  /** Formats the hover readout for one sample. */
  formatSample: (index: number, x: number, y: number) => string;
}

interface Palette {
  bg: string;
  border: string;
  grid: string;
  label: string;
  cursor: string;
  rising: string;
  falling: string;
  overall: string;
}

const LIGHT_PALETTE: Palette = {
  bg: "#f8fafc",
  border: "#cbd5e1",
  grid: "#e2e8f0",
  label: "#475569",
  cursor: "#0f172a",
  rising: "#0C447C",
  falling: "#B45309",
  overall: "#15803d",
};

const DARK_PALETTE: Palette = {
  bg: "#0f0f12",
  border: "#3f3f46",
  grid: "#27272a",
  label: "#d4d4d8",
  cursor: "#e4e4e7",
  rising: "#60a5fa",
  falling: "#fbbf24",
  overall: "#4ade80",
};

const WIDTH = 720;
const HEIGHT = 340;
const MARGIN = { top: 22, right: 20, bottom: 40, left: 56 };

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
  const pad = (hi - lo) * 0.06;
  return [lo - pad, hi + pad];
}

export function Lab1XYChart({
  xs,
  ys,
  splitIndex,
  lines,
  xLabel,
  yLabel,
  risingLabel,
  fallingLabel,
  hoverHint,
  formatSample,
}: Lab1XYChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDark = useIsDarkMode();
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const plotW = WIDTH - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;

  const clampIndex = useCallback(
    (i: number) => Math.min(xs.length - 1, Math.max(0, i)),
    [xs.length],
  );

  // Keyboard equivalent of hovering: a single focusable proxy sitting over
  // the canvas (role="slider" — one roving stop, since there is only one
  // trajectory to step through) so ArrowLeft/ArrowRight walk the same
  // hoverIndex the pointer drives. Focus lands here as soon as arrow-key
  // navigation starts, not only via aria-describedby/aria-live.
  const handleProxyKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      setHoverIndex((prev) =>
        prev === null ? 0 : clampIndex(prev + (e.key === "ArrowRight" ? 1 : -1)),
      );
    },
    [clampIndex],
  );

  const handleProxyFocus = useCallback(() => {
    setHoverIndex((prev) => prev ?? 0);
  }, []);

  // The trajectory doubles back on itself, so hovering picks the nearest
  // sample in screen space rather than indexing by x.
  const handleMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * WIDTH;
      const py = ((e.clientY - rect.top) / rect.height) * HEIGHT;
      const [xLo, xHi] = extent(xs);
      const [yLo, yHi] = extent(ys);
      let best = -1;
      let bestD = Infinity;
      for (let k = 0; k < xs.length; k++) {
        const sx = MARGIN.left + (((xs[k] ?? 0) - xLo) / (xHi - xLo)) * plotW;
        const sy =
          MARGIN.top + plotH - (((ys[k] ?? 0) - yLo) / (yHi - yLo)) * plotH;
        const d = (sx - px) * (sx - px) + (sy - py) * (sy - py);
        if (d < bestD) {
          bestD = d;
          best = k;
        }
      }
      setHoverIndex(bestD < 900 ? best : null);
    },
    [plotH, plotW, xs, ys],
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

    const [xLo, xHi] = extent(xs);
    const [yLo, yHi] = extent(ys);
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

    // Fitted lines, clipped to the plot box.
    ctx.save();
    ctx.beginPath();
    ctx.rect(MARGIN.left, MARGIN.top, plotW, plotH);
    ctx.clip();
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.4;
    for (const line of lines) {
      ctx.strokeStyle = palette[line.tone];
      ctx.beginPath();
      ctx.moveTo(sx(xLo), sy(line.slope * xLo + line.intercept));
      ctx.lineTo(sx(xHi), sy(line.slope * xHi + line.intercept));
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // The measured trajectory, one colour per branch of the sweep.
    ctx.lineWidth = 1.8;
    ctx.lineJoin = "round";
    for (const branch of ["rising", "falling"] as const) {
      const from = branch === "rising" ? 0 : splitIndex;
      const to = branch === "rising" ? splitIndex : xs.length - 1;
      ctx.strokeStyle = palette[branch];
      ctx.beginPath();
      for (let k = from; k <= to; k++) {
        const px = sx(xs[k] ?? 0);
        const py = sy(ys[k] ?? 0);
        if (k === from) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.restore();

    // Legend, in the top-left corner: the trajectory climbs away from it, so
    // it is the one part of the box the data never reaches.
    const entries = [
      { tone: "rising" as const, label: risingLabel, dashed: false },
      { tone: "falling" as const, label: fallingLabel, dashed: false },
      ...lines.map((l) => ({ tone: l.tone, label: l.label, dashed: true })),
    ];
    let ly = MARGIN.top + 10;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    for (const entry of entries) {
      ctx.strokeStyle = palette[entry.tone];
      ctx.lineWidth = 2;
      ctx.setLineDash(entry.dashed ? [4, 3] : []);
      ctx.beginPath();
      ctx.moveTo(MARGIN.left + 10, ly);
      ctx.lineTo(MARGIN.left + 32, ly);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = palette.label;
      ctx.fillText(entry.label, MARGIN.left + 38, ly);
      ly += 15;
    }

    if (hoverIndex !== null) {
      const px = sx(xs[hoverIndex] ?? 0);
      const py = sy(ys[hoverIndex] ?? 0);
      ctx.strokeStyle = palette.cursor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [
    fallingLabel,
    hoverIndex,
    lines,
    palette,
    plotH,
    plotW,
    risingLabel,
    splitIndex,
    xLabel,
    xs,
    yLabel,
    ys,
  ]);

  const readout =
    hoverIndex === null
      ? hoverHint
      : formatSample(hoverIndex, xs[hoverIndex] ?? 0, ys[hoverIndex] ?? 0);

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
          aria-valuemax={Math.max(0, xs.length - 1)}
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
