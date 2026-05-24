"use client";

import { useEffect, useRef, useState } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import { formatNum, niceTicks } from "@/lib/chartUtils";
import type { TraceSamples } from "@/lib/sampling";

interface TraceChartProps {
  samples: TraceSamples | null;
  vScale: number;
  eScale: number;
  onClear: () => void;
}

interface Palette {
  bg: string;
  border: string;
  grid: string;
  zero: string;
  label: string;
  vLine: string;
  vLabel: string;
  eLine: string;
  eLabel: string;
}

const LIGHT_PALETTE: Palette = {
  bg: "#f8fafc",
  border: "#cbd5e1",
  grid: "#e2e8f0",
  zero: "#94a3b8",
  label: "#475569",
  vLine: "#0C447C",
  vLabel: "#0C447C",
  eLine: "#791F1F",
  eLabel: "#791F1F",
};

const DARK_PALETTE: Palette = {
  bg: "#0f0f12",
  border: "#3f3f46",
  grid: "#27272a",
  zero: "#52525b",
  label: "#d4d4d8",
  vLine: "#60a5fa",
  vLabel: "#93c5fd",
  eLine: "#f87171",
  eLabel: "#fca5a5",
};

const WIDTH = 580;
const HEIGHT = 260;
const MARGIN = { top: 18, right: 56, bottom: 36, left: 56 };

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

export function TraceChart({
  samples,
  vScale,
  eScale,
  onClear,
}: TraceChartProps) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDark = useIsDarkMode();
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;

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
    drawChart(ctx, samples, vScale, eScale, palette, {
      axisV: t("trace.axis_v"),
      axisE: t("trace.axis_e"),
      axisS: t("trace.axis_s"),
    });
  }, [samples, vScale, eScale, palette, t]);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-2 rounded-md border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          {t("trace.title")}
        </span>
        <button
          type="button"
          onClick={onClear}
          disabled={!samples}
          className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          {t("trace.clear")}
        </button>
      </div>
      <div className="relative w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "auto",
            aspectRatio: `${WIDTH} / ${HEIGHT}`,
          }}
          className="block rounded bg-white dark:bg-zinc-950"
        />
        {!samples && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
            {t("trace.empty_hint")}
          </div>
        )}
      </div>
    </div>
  );
}

interface ChartLabels {
  axisV: string;
  axisE: string;
  axisS: string;
}

function drawChart(
  ctx: CanvasRenderingContext2D,
  samples: TraceSamples | null,
  vScale: number,
  eScale: number,
  palette: Palette,
  labels: ChartLabels,
): void {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  // Background plot area.
  const plotX = MARGIN.left;
  const plotY = MARGIN.top;
  const plotW = WIDTH - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  ctx.fillStyle = palette.bg;
  ctx.fillRect(plotX, plotY, plotW, plotH);
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(plotX + 0.5, plotY + 0.5, plotW, plotH);

  if (!samples) return;

  const { s, V, E, sMax } = samples;

  // Axes anchored to the field's global scale (same as heatmap), so a
  // near-constant trace looks near-constant — instead of being amplified by
  // an auto-fit Y range. Symmetric around 0 for V, [0, eScale] for |E|.
  const vBound = vScale > 0 ? vScale : 1;
  const vLow = -vBound;
  const vHigh = vBound;
  const eHigh = eScale > 0 ? eScale : 1;

  const xOf = (sv: number): number =>
    plotX + (sMax > 0 ? (sv / sMax) * plotW : 0);
  const yOfV = (v: number): number =>
    plotY + plotH - ((v - vLow) / (vHigh - vLow)) * plotH;
  const yOfE = (e: number): number => plotY + plotH - (e / eHigh) * plotH;

  // Grid lines + tick labels.
  ctx.font = "11px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 1;

  const vTicks = niceTicks(vLow, vHigh, 5);
  for (const tv of vTicks) {
    const y = yOfV(tv);
    ctx.strokeStyle = palette.grid;
    ctx.beginPath();
    ctx.moveTo(plotX, y);
    ctx.lineTo(plotX + plotW, y);
    ctx.stroke();
    ctx.fillStyle = palette.vLabel;
    ctx.fillText(formatNum(tv), plotX - 6, y);
  }

  const eTicks = niceTicks(0, eHigh, 4);
  ctx.textAlign = "left";
  for (const te of eTicks) {
    const y = yOfE(te);
    ctx.fillStyle = palette.eLabel;
    ctx.fillText(formatNum(te), plotX + plotW + 6, y);
  }

  // Zero line for V (if applicable) — emphasize.
  if (vLow < 0 && vHigh > 0) {
    const y0 = yOfV(0);
    ctx.strokeStyle = palette.zero;
    ctx.beginPath();
    ctx.moveTo(plotX, y0);
    ctx.lineTo(plotX + plotW, y0);
    ctx.stroke();
  }

  // X ticks.
  const sTicks = niceTicks(0, sMax, 6);
  ctx.fillStyle = palette.label;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const ts of sTicks) {
    const x = xOf(ts);
    ctx.strokeStyle = palette.grid;
    ctx.beginPath();
    ctx.moveTo(x, plotY);
    ctx.lineTo(x, plotY + plotH);
    ctx.stroke();
    ctx.fillText(formatNum(ts), x, plotY + plotH + 4);
  }

  // V curve.
  ctx.beginPath();
  ctx.strokeStyle = palette.vLine;
  ctx.lineWidth = 1.8;
  for (let k = 0; k < s.length; k++) {
    const x = xOf(s[k] as number);
    const y = yOfV(V[k] as number);
    if (k === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // E curve.
  ctx.beginPath();
  ctx.strokeStyle = palette.eLine;
  ctx.lineWidth = 1.8;
  for (let k = 0; k < s.length; k++) {
    const x = xOf(s[k] as number);
    const y = yOfE(E[k] as number);
    if (k === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Axis labels.
  ctx.fillStyle = palette.vLabel;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(labels.axisV, 8, plotY + 4);

  ctx.fillStyle = palette.eLabel;
  ctx.textAlign = "right";
  ctx.fillText(labels.axisE, WIDTH - 8, plotY + 4);

  ctx.fillStyle = palette.label;
  ctx.textAlign = "center";
  ctx.fillText(labels.axisS, plotX + plotW / 2, HEIGHT - 4);
}
