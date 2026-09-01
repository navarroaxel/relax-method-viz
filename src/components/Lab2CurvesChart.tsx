"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { formatNum, niceTicks } from "@/lib/chartUtils";

export interface CurveChartSeries {
  label: string;
  currentA: Float64Array;
  forceMn: Float64Array;
  /** Slope a of the fitted F = a·I² + b, in mN/A². */
  slopeMnPerA2: number;
  /** Intercept b, in mN. */
  interceptMn: number;
}

interface Lab2CurvesChartProps {
  series: CurveChartSeries[];
  /**
   * When true the x axis carries I² instead of I, which turns the fitted
   * parabolas into straight lines — the linearisation the report leans on to
   * claim F ∝ I².
   */
  linearize: boolean;
  xLabel: string;
  yLabel: string;
  hoverHint: string;
  /** Formats the hover readout for one point of one run. */
  formatSample: (series: CurveChartSeries, pointIndex: number) => string;
}

interface Palette {
  bg: string;
  border: string;
  grid: string;
  label: string;
  cursor: string;
  series: string[];
}

const LIGHT_PALETTE: Palette = {
  bg: "#f8fafc",
  border: "#cbd5e1",
  grid: "#e2e8f0",
  label: "#475569",
  cursor: "#0f172a",
  series: ["#0C447C", "#B45309", "#15803d", "#7c3aed"],
};

const DARK_PALETTE: Palette = {
  bg: "#0f0f12",
  border: "#3f3f46",
  grid: "#27272a",
  label: "#d4d4d8",
  cursor: "#e4e4e7",
  series: ["#60a5fa", "#fbbf24", "#4ade80", "#c084fc"],
};

const WIDTH = 720;
const HEIGHT = 340;
const MARGIN = { top: 22, right: 20, bottom: 40, left: 56 };
/** Squared pixel distance within which the pointer latches onto a point. */
const HOVER_RADIUS2 = 900;

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

function extent(values: number[]): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of values) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (!(hi > lo)) return [lo - 1, hi + 1];
  const pad = (hi - lo) * 0.08;
  return [lo - pad, hi + pad];
}

/**
 * The three stepped F-vs-I runs on one pair of axes, with their fits, and a
 * switch between the raw quadratic view and the I² linearisation.
 *
 * Both views are worth having: the raw one shows the F ∝ I² shape the theory
 * predicts, the linearised one shows how *well* it holds — on a straight line
 * the eye can see a curved residual that it would never catch on a parabola.
 */
export function Lab2CurvesChart({
  series,
  linearize,
  xLabel,
  yLabel,
  hoverHint,
  formatSample,
}: Lab2CurvesChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDark = useIsDarkMode();
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
  const [hover, setHover] = useState<{ series: number; point: number } | null>(
    null,
  );

  const plotW = WIDTH - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;

  /** x value actually plotted for a current: I, or I² when linearised. */
  const toX = useCallback(
    (currentA: number) => (linearize ? currentA * currentA : currentA),
    [linearize],
  );

  const ranges = useMemo(() => {
    const xs: number[] = [];
    const ys: number[] = [];
    for (const s of series) {
      for (let k = 0; k < s.currentA.length; k++) {
        xs.push(toX(s.currentA[k] ?? 0));
        ys.push(s.forceMn[k] ?? 0);
      }
    }
    return { x: extent(xs), y: extent(ys) };
  }, [series, toX]);

  // Points span several runs, so keyboard stepping walks one flat ordering —
  // run 0's points, then run 1's — rather than indexing by x, which the runs
  // do not share a common sweep over.
  const flat = useMemo(
    () =>
      series.flatMap((s, si) =>
        Array.from({ length: s.currentA.length }, (_, k) => ({
          series: si,
          point: k,
        })),
      ),
    [series],
  );

  const flatIndexOfHover = hover
    ? flat.findIndex(
        (f) => f.series === hover.series && f.point === hover.point,
      )
    : -1;

  const clampFlat = useCallback(
    (i: number) => Math.min(flat.length - 1, Math.max(0, i)),
    [flat.length],
  );

  const handleProxyKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      if (flat.length === 0) return;
      const current = flatIndexOfHover < 0 ? 0 : flatIndexOfHover;
      const next =
        flatIndexOfHover < 0
          ? current
          : clampFlat(current + (e.key === "ArrowRight" ? 1 : -1));
      setHover(flat[next] ?? null);
    },
    [clampFlat, flat, flatIndexOfHover],
  );

  const handleProxyFocus = useCallback(() => {
    setHover((prev) => prev ?? flat[0] ?? null);
  }, [flat]);

  const handleMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * WIDTH;
      const py = ((e.clientY - rect.top) / rect.height) * HEIGHT;
      const [xLo, xHi] = ranges.x;
      const [yLo, yHi] = ranges.y;
      let best: { series: number; point: number } | null = null;
      let bestD = Infinity;
      series.forEach((s, si) => {
        for (let k = 0; k < s.currentA.length; k++) {
          const sx =
            MARGIN.left +
            ((toX(s.currentA[k] ?? 0) - xLo) / (xHi - xLo)) * plotW;
          const sy =
            MARGIN.top +
            plotH -
            (((s.forceMn[k] ?? 0) - yLo) / (yHi - yLo)) * plotH;
          const d = (sx - px) * (sx - px) + (sy - py) * (sy - py);
          if (d < bestD) {
            bestD = d;
            best = { series: si, point: k };
          }
        }
      });
      setHover(bestD < HOVER_RADIUS2 ? best : null);
    },
    [plotH, plotW, ranges, series, toX],
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

    const [xLo, xHi] = ranges.x;
    const [yLo, yHi] = ranges.y;
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

    // Fits. In the linearised view F = a·x + b is a straight line, so two
    // points suffice; in the raw view the same fit is a parabola and has to
    // be walked across the axis.
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.2;
    series.forEach((s, si) => {
      ctx.strokeStyle =
        palette.series[si % palette.series.length] ?? palette.label;
      ctx.beginPath();
      if (linearize) {
        ctx.moveTo(sx(xLo), sy(s.slopeMnPerA2 * xLo + s.interceptMn));
        ctx.lineTo(sx(xHi), sy(s.slopeMnPerA2 * xHi + s.interceptMn));
      } else {
        const steps = 96;
        for (let t = 0; t <= steps; t++) {
          const i = xLo + ((xHi - xLo) * t) / steps;
          const f = s.slopeMnPerA2 * i * i + s.interceptMn;
          if (t === 0) ctx.moveTo(sx(i), sy(f));
          else ctx.lineTo(sx(i), sy(f));
        }
      }
      ctx.stroke();
    });
    ctx.setLineDash([]);

    series.forEach((s, si) => {
      const color = palette.series[si % palette.series.length] ?? palette.label;
      ctx.fillStyle = color;
      for (let k = 0; k < s.currentA.length; k++) {
        ctx.beginPath();
        ctx.arc(
          sx(toX(s.currentA[k] ?? 0)),
          sy(s.forceMn[k] ?? 0),
          3,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    });
    ctx.restore();

    // Legend, top-left inside the plot box.
    let ly = MARGIN.top + 12;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    series.forEach((s, si) => {
      ctx.fillStyle =
        palette.series[si % palette.series.length] ?? palette.label;
      ctx.beginPath();
      ctx.arc(MARGIN.left + 16, ly, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = palette.label;
      ctx.fillText(s.label, MARGIN.left + 26, ly);
      ly += 14;
    });

    if (hover) {
      const s = series[hover.series];
      if (s) {
        ctx.strokeStyle = palette.cursor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(
          sx(toX(s.currentA[hover.point] ?? 0)),
          sy(s.forceMn[hover.point] ?? 0),
          6.5,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
    }
  }, [
    hover,
    linearize,
    palette,
    plotH,
    plotW,
    ranges,
    series,
    toX,
    xLabel,
    yLabel,
  ]);

  const readout = (() => {
    if (!hover) return hoverHint;
    const s = series[hover.series];
    if (!s) return hoverHint;
    return formatSample(s, hover.point);
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
          onPointerLeave={() => setHover(null)}
        />
        {/* Focusable keyboard proxy, same contract as the lab 1 charts:
            pointer events stay off so the canvas keeps hover and clicks,
            while Tab and ArrowLeft/ArrowRight land here and drive the same
            hover state. */}
        <div
          role="slider"
          tabIndex={0}
          aria-label={`${yLabel} vs ${xLabel}`}
          aria-valuemin={0}
          aria-valuemax={Math.max(0, flat.length - 1)}
          aria-valuenow={flatIndexOfHover < 0 ? 0 : flatIndexOfHover}
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
