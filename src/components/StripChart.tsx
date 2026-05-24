"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import { formatNum, niceTicks } from "@/lib/chartUtils";

export interface ProbeHistory {
  tMs: Float32Array;
  V: Float32Array;
  E: Float32Array;
  count: number;
}

export const PROBE_BUFFER_CAP = 2048;
export const PROBE_WINDOW_MS = 10_000;

export function makeProbeHistory(): ProbeHistory {
  return {
    tMs: new Float32Array(PROBE_BUFFER_CAP),
    V: new Float32Array(PROBE_BUFFER_CAP),
    E: new Float32Array(PROBE_BUFFER_CAP),
    count: 0,
  };
}

interface StripChartProps {
  mode: "ac" | "probe";
  // AC mode:
  acPhaseRad?: number;
  acPeriodSec?: number;
  // Probe mode:
  historyRef?: RefObject<ProbeHistory>;
  vScale?: number;
  eScale?: number;
  // Bumped on every solver progress event so the chart re-renders.
  renderTick?: number;
  onClear?: () => void;
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
const HEIGHT = 200;
const MARGIN = { top: 18, right: 56, bottom: 32, left: 56 };
const WINDOW_SEC = PROBE_WINDOW_MS / 1000;

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

export function StripChart(props: StripChartProps) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDark = useIsDarkMode();
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;

  const {
    mode,
    acPhaseRad,
    acPeriodSec,
    historyRef,
    vScale,
    eScale,
    renderTick,
  } = props;

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
    if (mode === "ac") {
      drawAc(ctx, acPhaseRad ?? 0, acPeriodSec ?? 1, palette, {
        axisT: t("stripchart.axis_t"),
      });
    } else {
      drawProbe(
        ctx,
        historyRef?.current,
        performance.now(),
        vScale ?? 1,
        eScale ?? 1,
        palette,
        {
          axisV: t("trace.axis_v"),
          axisE: t("trace.axis_e"),
          axisT: t("stripchart.axis_t"),
          emptyHint: t("stripchart.probe.empty_hint"),
        },
      );
    }
    // renderTick triggers the redraw when the parent's ring buffer changes;
    // historyRef itself is a stable identity, so reading .current inside the
    // effect picks up the latest mutation.
  }, [
    mode,
    acPhaseRad,
    acPeriodSec,
    historyRef,
    vScale,
    eScale,
    renderTick,
    palette,
    t,
  ]);

  const title =
    mode === "ac" ? t("stripchart.ac.title") : t("stripchart.probe.title");

  return (
    <div className="flex w-full max-w-3xl flex-col gap-2 rounded-md border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">{title}</span>
        {props.mode === "probe" && props.onClear && (
          <button
            type="button"
            onClick={props.onClear}
            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            {t("trace.clear")}
          </button>
        )}
      </div>
      <div className="relative w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "auto", aspectRatio: `${WIDTH} / ${HEIGHT}` }}
          className="block rounded bg-white dark:bg-zinc-950"
        />
      </div>
    </div>
  );
}

interface AcLabels {
  axisT: string;
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
): { plotX: number; plotY: number; plotW: number; plotH: number } {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  const plotX = MARGIN.left;
  const plotY = MARGIN.top;
  const plotW = WIDTH - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  ctx.fillStyle = palette.bg;
  ctx.fillRect(plotX, plotY, plotW, plotH);
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(plotX + 0.5, plotY + 0.5, plotW, plotH);
  return { plotX, plotY, plotW, plotH };
}

function drawTimeAxis(
  ctx: CanvasRenderingContext2D,
  plotX: number,
  plotY: number,
  plotW: number,
  plotH: number,
  palette: Palette,
  axisLabel: string,
): void {
  // X grid from -WINDOW_SEC..0 with 1-second steps.
  ctx.font = "11px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.fillStyle = palette.label;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let sec = -WINDOW_SEC; sec <= 0; sec += 1) {
    const x = plotX + ((sec + WINDOW_SEC) / WINDOW_SEC) * plotW;
    ctx.strokeStyle = palette.grid;
    ctx.beginPath();
    ctx.moveTo(x, plotY);
    ctx.lineTo(x, plotY + plotH);
    ctx.stroke();
    ctx.fillText(sec === 0 ? "0" : `${sec}`, x, plotY + plotH + 4);
  }
  ctx.fillStyle = palette.label;
  ctx.textAlign = "center";
  ctx.fillText(axisLabel, plotX + plotW / 2, HEIGHT - 14);
}

function drawAc(
  ctx: CanvasRenderingContext2D,
  acPhaseRad: number,
  acPeriodSec: number,
  palette: Palette,
  labels: AcLabels,
): void {
  const { plotX, plotY, plotW, plotH } = drawFrame(ctx, palette);

  // Y axis labels (-1, 0, 1).
  const yOf = (v: number): number => plotY + plotH - ((v + 1) / 2) * plotH;
  const yTicks = [-1, -0.5, 0, 0.5, 1];
  ctx.font = "11px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.fillStyle = palette.label;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 1;
  for (const tv of yTicks) {
    const y = yOf(tv);
    ctx.strokeStyle = palette.grid;
    ctx.beginPath();
    ctx.moveTo(plotX, y);
    ctx.lineTo(plotX + plotW, y);
    ctx.stroke();
    ctx.fillText(tv.toFixed(1), plotX - 6, y);
  }
  // Zero line emphasized.
  const y0 = yOf(0);
  ctx.strokeStyle = palette.zero;
  ctx.beginPath();
  ctx.moveTo(plotX, y0);
  ctx.lineTo(plotX + plotW, y0);
  ctx.stroke();

  drawTimeAxis(ctx, plotX, plotY, plotW, plotH, palette, labels.axisT);

  // Plot sin(acPhaseRad - 2π·Δt/period) for Δt in [-WINDOW_SEC..0].
  // At the right edge (Δt = 0) the value is sin(acPhaseRad). To the left
  // (negative Δt) the wave is what was happening in the past, so we subtract
  // the corresponding phase increment.
  if (acPeriodSec > 0) {
    const omega = (2 * Math.PI) / acPeriodSec;
    const STEPS = 240;
    ctx.beginPath();
    ctx.strokeStyle = palette.vLine;
    ctx.lineWidth = 1.8;
    for (let s = 0; s <= STEPS; s++) {
      const dt = -WINDOW_SEC + (s / STEPS) * WINDOW_SEC;
      const v = Math.sin(acPhaseRad + omega * dt);
      const x = plotX + ((dt + WINDOW_SEC) / WINDOW_SEC) * plotW;
      const y = yOf(v);
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Title-like axis label inside the plot top-left ("sin(ωt)").
  ctx.fillStyle = palette.vLabel;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("sin(ωt)", 8, plotY + 4);
}

interface ProbeLabels {
  axisV: string;
  axisE: string;
  axisT: string;
  emptyHint: string;
}

function drawProbe(
  ctx: CanvasRenderingContext2D,
  history: ProbeHistory | undefined,
  nowMs: number,
  vScale: number,
  eScale: number,
  palette: Palette,
  labels: ProbeLabels,
): void {
  const { plotX, plotY, plotW, plotH } = drawFrame(ctx, palette);

  const vBound = vScale > 0 ? vScale : 1;
  const vLow = -vBound;
  const vHigh = vBound;
  const eHigh = eScale > 0 ? eScale : 1;

  const xOf = (dtSec: number): number =>
    plotX + ((dtSec + WINDOW_SEC) / WINDOW_SEC) * plotW;
  const yOfV = (v: number): number =>
    plotY + plotH - ((v - vLow) / (vHigh - vLow)) * plotH;
  const yOfE = (e: number): number =>
    plotY + plotH - (e / eHigh) * plotH;

  // Grid + tick labels for both axes.
  ctx.font = "11px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 1;
  const vTicks = niceTicks(vLow, vHigh, 5);
  ctx.textAlign = "right";
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
  // Zero line for V.
  if (vLow < 0 && vHigh > 0) {
    const y0 = yOfV(0);
    ctx.strokeStyle = palette.zero;
    ctx.beginPath();
    ctx.moveTo(plotX, y0);
    ctx.lineTo(plotX + plotW, y0);
    ctx.stroke();
  }

  drawTimeAxis(ctx, plotX, plotY, plotW, plotH, palette, labels.axisT);

  if (!history || history.count === 0) {
    // Axis labels still drawn.
    ctx.fillStyle = palette.vLabel;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(labels.axisV, 8, plotY + 4);
    ctx.fillStyle = palette.eLabel;
    ctx.textAlign = "right";
    ctx.fillText(labels.axisE, WIDTH - 8, plotY + 4);
    // Centered empty-state hint.
    ctx.fillStyle = palette.label;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "12px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.fillText(labels.emptyHint, plotX + plotW / 2, plotY + plotH / 2);
    return;
  }

  // V curve.
  ctx.beginPath();
  ctx.strokeStyle = palette.vLine;
  ctx.lineWidth = 1.8;
  let started = false;
  for (let k = 0; k < history.count; k++) {
    const dt = ((history.tMs[k] as number) - nowMs) / 1000;
    if (dt < -WINDOW_SEC) continue;
    const x = xOf(dt);
    const y = yOfV(history.V[k] as number);
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // E curve.
  ctx.beginPath();
  ctx.strokeStyle = palette.eLine;
  ctx.lineWidth = 1.8;
  started = false;
  for (let k = 0; k < history.count; k++) {
    const dt = ((history.tMs[k] as number) - nowMs) / 1000;
    if (dt < -WINDOW_SEC) continue;
    const x = xOf(dt);
    const y = yOfE(history.E[k] as number);
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else ctx.lineTo(x, y);
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
}

// Append a sample, trimming entries older than nowMs - PROBE_WINDOW_MS.
// Operates in-place; returns the same object.
export function pushProbeSample(
  h: ProbeHistory,
  tMs: number,
  V: number,
  E: number,
): ProbeHistory {
  // Drop expired entries from the head.
  const cutoff = tMs - PROBE_WINDOW_MS;
  let drop = 0;
  while (drop < h.count && (h.tMs[drop] as number) < cutoff) drop++;
  if (drop > 0) {
    h.tMs.copyWithin(0, drop, h.count);
    h.V.copyWithin(0, drop, h.count);
    h.E.copyWithin(0, drop, h.count);
    h.count -= drop;
  }
  // If still full, drop the oldest one.
  if (h.count >= PROBE_BUFFER_CAP) {
    h.tMs.copyWithin(0, 1, h.count);
    h.V.copyWithin(0, 1, h.count);
    h.E.copyWithin(0, 1, h.count);
    h.count -= 1;
  }
  h.tMs[h.count] = tMs;
  h.V[h.count] = V;
  h.E[h.count] = E;
  h.count++;
  return h;
}
