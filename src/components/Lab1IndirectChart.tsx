"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { formatNum, niceTicks } from "@/lib/chartUtils";

export interface IndirectChartSession {
  label: string;
  n: number[];
  forceMn: Float64Array;
  currentA: Float64Array;
  outlierIndices: number[];
  slopeMnPerA: number;
  interceptMn: number;
}

interface Lab1IndirectChartProps {
  sessions: IndirectChartSession[];
  xLabel: string;
  yLabel: string;
  hoverHint: string;
  outlierLabel: string;
  /** Formats the hover readout for one point. */
  formatSample: (session: IndirectChartSession, pointIndex: number) => string;
}

interface Palette {
  bg: string;
  border: string;
  grid: string;
  label: string;
  cursor: string;
  outlier: string;
  series: string[];
}

const LIGHT_PALETTE: Palette = {
  bg: "#f8fafc",
  border: "#cbd5e1",
  grid: "#e2e8f0",
  label: "#475569",
  cursor: "#0f172a",
  outlier: "#dc2626",
  series: ["#0C447C", "#B45309", "#15803d", "#7c3aed"],
};

const DARK_PALETTE: Palette = {
  bg: "#0f0f12",
  border: "#3f3f46",
  grid: "#27272a",
  label: "#d4d4d8",
  cursor: "#e4e4e7",
  outlier: "#f87171",
  series: ["#60a5fa", "#fbbf24", "#4ade80", "#c084fc"],
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

function extent(sessions: IndirectChartSession[], pick: "current" | "force"): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const s of sessions) {
    const values = pick === "current" ? s.currentA : s.forceMn;
    for (let k = 0; k < values.length; k++) {
      const v = values[k] ?? 0;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  }
  if (!(hi > lo)) return [lo - 1, hi + 1];
  const pad = (hi - lo) * 0.08;
  return [lo - pad, hi + pad];
}

export function Lab1IndirectChart({
  sessions,
  xLabel,
  yLabel,
  hoverHint,
  outlierLabel,
  formatSample,
}: Lab1IndirectChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDark = useIsDarkMode();
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
  const [hover, setHover] = useState<{ session: number; point: number } | null>(
    null,
  );

  const plotW = WIDTH - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;

  const handleMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * WIDTH;
      const py = ((e.clientY - rect.top) / rect.height) * HEIGHT;
      const [xLo, xHi] = extent(sessions, "current");
      const [yLo, yHi] = extent(sessions, "force");
      let best: { session: number; point: number } | null = null;
      let bestD = Infinity;
      sessions.forEach((s, si) => {
        for (let k = 0; k < s.currentA.length; k++) {
          const sx =
            MARGIN.left + (((s.currentA[k] ?? 0) - xLo) / (xHi - xLo)) * plotW;
          const sy =
            MARGIN.top +
            plotH -
            (((s.forceMn[k] ?? 0) - yLo) / (yHi - yLo)) * plotH;
          const d = (sx - px) * (sx - px) + (sy - py) * (sy - py);
          if (d < bestD) {
            bestD = d;
            best = { session: si, point: k };
          }
        }
      });
      setHover(bestD < 900 ? best : null);
    },
    [plotH, plotW, sessions],
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

    const [xLo, xHi] = extent(sessions, "current");
    const [yLo, yHi] = extent(sessions, "force");
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

    // Fitted lines, one per session, clipped to the plot box.
    ctx.save();
    ctx.beginPath();
    ctx.rect(MARGIN.left, MARGIN.top, plotW, plotH);
    ctx.clip();
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.2;
    sessions.forEach((s, si) => {
      ctx.strokeStyle = palette.series[si % palette.series.length] ?? palette.label;
      ctx.beginPath();
      ctx.moveTo(sx(xLo), sy(s.slopeMnPerA * xLo + s.interceptMn));
      ctx.lineTo(sx(xHi), sy(s.slopeMnPerA * xHi + s.interceptMn));
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Points, one colour per session; flagged outliers drawn as a red ring.
    sessions.forEach((s, si) => {
      const color = palette.series[si % palette.series.length] ?? palette.label;
      for (let k = 0; k < s.currentA.length; k++) {
        const px = sx(s.currentA[k] ?? 0);
        const py = sy(s.forceMn[k] ?? 0);
        const isOutlier = s.outlierIndices.includes(k);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, isOutlier ? 3 : 2.6, 0, Math.PI * 2);
        ctx.fill();
        if (isOutlier) {
          ctx.strokeStyle = palette.outlier;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(px, py, 6.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    });
    ctx.restore();

    // Legend, top-left.
    let ly = MARGIN.top + 10;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    sessions.forEach((s, si) => {
      const color = palette.series[si % palette.series.length] ?? palette.label;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(MARGIN.left + 16, ly, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = palette.label;
      ctx.fillText(s.label, MARGIN.left + 26, ly);
      ly += 14;
    });
    ctx.strokeStyle = palette.outlier;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(MARGIN.left + 16, ly, 6.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = palette.label;
    ctx.fillText(outlierLabel, MARGIN.left + 26, ly);

    if (hover) {
      const s = sessions[hover.session];
      if (s) {
        const px = sx(s.currentA[hover.point] ?? 0);
        const py = sy(s.forceMn[hover.point] ?? 0);
        ctx.strokeStyle = palette.cursor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, [hover, outlierLabel, palette, plotH, plotW, sessions, xLabel, yLabel]);

  const readout = (() => {
    if (!hover) return hoverHint;
    const s = sessions[hover.session];
    if (!s) return hoverHint;
    return formatSample(s, hover.point);
  })();

  return (
    <div className="flex flex-col gap-1">
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "auto",
          aspectRatio: `${WIDTH} / ${HEIGHT}`,
        }}
        className="rounded-md border border-zinc-200 dark:border-zinc-700"
        onPointerMove={handleMove}
        onPointerLeave={() => setHover(null)}
      />
      <p className="font-mono text-xs text-zinc-600 dark:text-zinc-300">
        {readout}
      </p>
    </div>
  );
}
