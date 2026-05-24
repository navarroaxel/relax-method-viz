"use client";

import { useEffect, useRef } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import type { TraceSamples } from "@/lib/sampling";

interface TraceChartProps {
  samples: TraceSamples | null;
  onClear: () => void;
}

const V_COLOR = "#0C447C";
const E_COLOR = "#791F1F";
const WIDTH = 580;
const HEIGHT = 260;
const MARGIN = { top: 18, right: 56, bottom: 36, left: 56 };

export function TraceChart({ samples, onClear }: TraceChartProps) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    if (canvas.width !== WIDTH * dpr || canvas.height !== HEIGHT * dpr) {
      canvas.width = WIDTH * dpr;
      canvas.height = HEIGHT * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawChart(ctx, samples, {
      axisV: t("trace.axis_v"),
      axisE: t("trace.axis_e"),
      axisS: t("trace.axis_s"),
    });
  }, [samples, t]);

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
          style={{ width: "100%", height: "auto", aspectRatio: `${WIDTH} / ${HEIGHT}` }}
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
  labels: ChartLabels,
): void {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  // Background plot area.
  const plotX = MARGIN.left;
  const plotY = MARGIN.top;
  const plotW = WIDTH - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(plotX, plotY, plotW, plotH);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  ctx.strokeRect(plotX + 0.5, plotY + 0.5, plotW, plotH);

  if (!samples) return;

  const { s, V, E, sMax, vMin, vMax, eMax } = samples;

  // V axis: symmetric around 0 if there's a sign change, otherwise tight.
  const absV = Math.max(Math.abs(vMin), Math.abs(vMax));
  let vLow: number;
  let vHigh: number;
  if (vMin < 0 && vMax > 0) {
    vLow = -absV;
    vHigh = absV;
  } else if (absV === 0) {
    vLow = -1;
    vHigh = 1;
  } else {
    vLow = vMin;
    vHigh = vMax;
    if (vLow === vHigh) {
      vLow -= 1;
      vHigh += 1;
    }
  }
  const eHigh = eMax > 0 ? eMax * 1.05 : 1;

  const xOf = (sv: number): number =>
    plotX + (sMax > 0 ? (sv / sMax) * plotW : 0);
  const yOfV = (v: number): number =>
    plotY + plotH - ((v - vLow) / (vHigh - vLow)) * plotH;
  const yOfE = (e: number): number =>
    plotY + plotH - (e / eHigh) * plotH;

  // Grid lines + tick labels.
  ctx.fillStyle = "#475569";
  ctx.font = "11px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;

  const vTicks = niceTicks(vLow, vHigh, 5);
  for (const tv of vTicks) {
    const y = yOfV(tv);
    ctx.beginPath();
    ctx.moveTo(plotX, y);
    ctx.lineTo(plotX + plotW, y);
    ctx.stroke();
    ctx.fillStyle = V_COLOR;
    ctx.fillText(formatNum(tv), plotX - 6, y);
  }

  const eTicks = niceTicks(0, eHigh, 4);
  ctx.textAlign = "left";
  for (const te of eTicks) {
    const y = yOfE(te);
    ctx.fillStyle = E_COLOR;
    ctx.fillText(formatNum(te), plotX + plotW + 6, y);
  }

  // Zero line for V (if applicable) — emphasize.
  if (vLow < 0 && vHigh > 0) {
    const y0 = yOfV(0);
    ctx.strokeStyle = "#94a3b8";
    ctx.beginPath();
    ctx.moveTo(plotX, y0);
    ctx.lineTo(plotX + plotW, y0);
    ctx.stroke();
  }

  // X ticks.
  const sTicks = niceTicks(0, sMax, 6);
  ctx.fillStyle = "#475569";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const ts of sTicks) {
    const x = xOf(ts);
    ctx.strokeStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(x, plotY);
    ctx.lineTo(x, plotY + plotH);
    ctx.stroke();
    ctx.fillText(formatNum(ts), x, plotY + plotH + 4);
  }

  // V curve.
  ctx.beginPath();
  ctx.strokeStyle = V_COLOR;
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
  ctx.strokeStyle = E_COLOR;
  ctx.lineWidth = 1.8;
  for (let k = 0; k < s.length; k++) {
    const x = xOf(s[k] as number);
    const y = yOfE(E[k] as number);
    if (k === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Axis labels.
  ctx.fillStyle = V_COLOR;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(labels.axisV, 8, plotY + 4);

  ctx.fillStyle = E_COLOR;
  ctx.textAlign = "right";
  ctx.fillText(labels.axisE, WIDTH - 8, plotY + 4);

  ctx.fillStyle = "#475569";
  ctx.textAlign = "center";
  ctx.fillText(labels.axisS, plotX + plotW / 2, HEIGHT - 4);
}

function niceTicks(lo: number, hi: number, count: number): number[] {
  if (!(hi > lo)) return [lo];
  const span = hi - lo;
  const raw = span / Math.max(1, count);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  let step: number;
  if (norm < 1.5) step = mag;
  else if (norm < 3) step = 2 * mag;
  else if (norm < 7) step = 5 * mag;
  else step = 10 * mag;
  const first = Math.ceil(lo / step) * step;
  const out: number[] = [];
  for (let v = first; v <= hi + step * 1e-6; v += step) {
    out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  }
  return out;
}

function formatNum(v: number): string {
  const a = Math.abs(v);
  if (a === 0) return "0";
  if (a >= 1000 || a < 0.01) return v.toExponential(1);
  if (a >= 100) return v.toFixed(0);
  if (a >= 10) return v.toFixed(1);
  return v.toFixed(2);
}
