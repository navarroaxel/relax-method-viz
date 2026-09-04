"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { formatNum, niceTicks } from "@/lib/chartUtils";
import { errorTerms } from "@/lib/lab2Geometria";

export interface Lab2ErrorChartLabels {
  xAxis: string;
  /** Left axis: share of Δμ₀, in %. */
  shareAxis: string;
  /** Right axis: total Δμ₀/μ₀, in %. */
  totalAxis: string;
  current: string;
  length: string;
  force: string;
  separation: string;
  total: string;
  hoverHint: string;
}

interface Lab2ErrorChartProps {
  labels: Lab2ErrorChartLabels;
  /** Slope a of F = a·I², in mN/A² — the curve the budget is evaluated along. */
  slopeMnPerA2: number;
  /** Current range to sweep, in A. */
  fromA: number;
  toA: number;
}

interface Palette {
  bg: string;
  border: string;
  grid: string;
  label: string;
  cursor: string;
  total: string;
  /** Fill colours in stacking order: separation, force, current, length. */
  bands: string[];
}

const LIGHT_PALETTE: Palette = {
  bg: "#f8fafc",
  border: "#cbd5e1",
  grid: "#e2e8f0",
  label: "#475569",
  cursor: "#0f172a",
  total: "#0f172a",
  bands: ["#7c3aed", "#0C447C", "#B45309", "#15803d"],
};

const DARK_PALETTE: Palette = {
  bg: "#0f0f12",
  border: "#3f3f46",
  grid: "#27272a",
  label: "#d4d4d8",
  cursor: "#e4e4e7",
  total: "#e4e4e7",
  bands: ["#c084fc", "#60a5fa", "#fbbf24", "#4ade80"],
};

const WIDTH = 720;
const HEIGHT = 340;
const MARGIN = { top: 22, right: 54, bottom: 40, left: 50 };
const SAMPLES = 180;
/** Ceiling of the right-hand axis, in % — the budget blows up as I → 0. */
const TOTAL_AXIS_MAX_PCT = 50;

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

/**
 * Which of the guide's four error terms dominates Δμ₀, as a function of the
 * operating current.
 *
 * Written out as relative errors the budget is
 * Δμ₀/μ₀ = 2ΔI/I + Δl/l + ΔF/F + Δr/r, so three of the four shrink as the
 * current is raised and one — Δr/r — does not move at all. The stacked bands
 * show the share of each; the line on the right axis shows what the whole
 * budget is worth. Reading the two together is the answer to "which term
 * hurts most": it depends on where you stand on the curve, and the crossover
 * is visible rather than asserted.
 */
export function Lab2ErrorChart({
  labels,
  slopeMnPerA2,
  fromA,
  toA,
}: Lab2ErrorChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDark = useIsDarkMode();
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const plotW = WIDTH - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;

  const samples = useMemo(() => {
    const out: {
      currentA: number;
      forceMn: number;
      /** Shares in stacking order: separation, force, current, length. */
      shares: [number, number, number, number];
      totalPct: number;
      dominant: string;
    }[] = [];
    for (let k = 0; k < SAMPLES; k++) {
      const currentA = fromA + ((toA - fromA) * k) / (SAMPLES - 1);
      const forceMn = slopeMnPerA2 * currentA * currentA;
      const e = errorTerms(currentA, forceMn);
      const t = e.totalAbs || 1;
      out.push({
        currentA,
        forceMn,
        shares: [
          (e.fromSeparation / t) * 100,
          (e.fromForce / t) * 100,
          (e.fromCurrent / t) * 100,
          (e.fromLength / t) * 100,
        ],
        totalPct: e.relativePct,
        dominant: e.dominant,
      });
    }
    return out;
  }, [fromA, slopeMnPerA2, toA]);

  const handleMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * WIDTH;
      const frac = (px - MARGIN.left) / plotW;
      if (frac < 0 || frac > 1) {
        setHoverIndex(null);
        return;
      }
      setHoverIndex(Math.round(frac * (SAMPLES - 1)));
    },
    [plotW],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      setHoverIndex((prev) => {
        const base = prev ?? Math.floor(SAMPLES / 2);
        const next = base + (e.key === "ArrowRight" ? 2 : -2);
        return Math.min(SAMPLES - 1, Math.max(0, next));
      });
    },
    [],
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

    const sx = (i: number) =>
      MARGIN.left + ((i - fromA) / (toA - fromA)) * plotW;
    const syShare = (pct: number) => MARGIN.top + plotH - (pct / 100) * plotH;
    const syTotal = (pct: number) =>
      MARGIN.top +
      plotH -
      (Math.min(pct, TOTAL_AXIS_MAX_PCT) / TOTAL_AXIS_MAX_PCT) * plotH;

    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.font = "11px ui-sans-serif, system-ui, sans-serif";

    // Stacked bands, drawn bottom-up.
    let baseline = new Array(SAMPLES).fill(0);
    for (let b = 0; b < 4; b++) {
      const top = samples.map(
        (s, k) => (baseline[k] ?? 0) + (s.shares[b] ?? 0),
      );
      ctx.fillStyle = palette.bands[b] ?? palette.label;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.moveTo(sx(samples[0]?.currentA ?? fromA), syShare(baseline[0] ?? 0));
      for (let k = 0; k < SAMPLES; k++) {
        ctx.lineTo(sx(samples[k]?.currentA ?? fromA), syShare(top[k] ?? 0));
      }
      for (let k = SAMPLES - 1; k >= 0; k--) {
        ctx.lineTo(
          sx(samples[k]?.currentA ?? fromA),
          syShare(baseline[k] ?? 0),
        );
      }
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      baseline = top;
    }

    // Grid and axes on top of the bands so the ticks stay readable.
    ctx.strokeStyle = palette.grid;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const v of niceTicks(0, 100, 5)) {
      const y = syShare(v);
      ctx.beginPath();
      ctx.moveTo(MARGIN.left, y);
      ctx.lineTo(MARGIN.left + plotW, y);
      ctx.stroke();
      ctx.fillStyle = palette.label;
      ctx.fillText(formatNum(v), MARGIN.left - 6, y);
    }

    ctx.textAlign = "left";
    for (const v of niceTicks(0, TOTAL_AXIS_MAX_PCT, 5)) {
      ctx.fillStyle = palette.label;
      ctx.fillText(formatNum(v), MARGIN.left + plotW + 6, syTotal(v));
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const v of niceTicks(fromA, toA, 8)) {
      const x = sx(v);
      ctx.strokeStyle = palette.grid;
      ctx.beginPath();
      ctx.moveTo(x, MARGIN.top);
      ctx.lineTo(x, MARGIN.top + plotH);
      ctx.stroke();
      ctx.fillStyle = palette.label;
      ctx.fillText(formatNum(v), x, MARGIN.top + plotH + 6);
    }
    ctx.fillText(labels.xAxis, MARGIN.left + plotW / 2, HEIGHT - 14);

    ctx.textAlign = "left";
    ctx.fillStyle = palette.label;
    ctx.fillText(labels.shareAxis, 4, 4);
    ctx.textAlign = "right";
    ctx.fillText(labels.totalAxis, WIDTH - 4, 4);

    // Total relative error, on the right axis.
    ctx.strokeStyle = palette.total;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    samples.forEach((s, k) => {
      const x = sx(s.currentA);
      const y = syTotal(s.totalPct);
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(MARGIN.left + 0.5, MARGIN.top + 0.5, plotW, plotH);

    // Legend across the top of the plot box. Stacking order is separation,
    // force, current, length — the same order `shares` uses, so band b and
    // label b always line up.
    const bandLabels = [
      labels.separation,
      labels.force,
      labels.current,
      labels.length,
    ];
    let lx = MARGIN.left + 12;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    bandLabels.forEach((name, b) => {
      ctx.fillStyle = palette.bands[b] ?? palette.label;
      ctx.globalAlpha = 0.65;
      ctx.fillRect(lx, MARGIN.top + 8, 10, 10);
      ctx.globalAlpha = 1;
      ctx.fillStyle = palette.label;
      ctx.fillText(name, lx + 14, MARGIN.top + 13);
      lx += 16 + ctx.measureText(name).width + 12;
    });

    if (hoverIndex !== null) {
      const s = samples[hoverIndex];
      if (s) {
        const x = sx(s.currentA);
        ctx.strokeStyle = palette.cursor;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x, MARGIN.top);
        ctx.lineTo(x, MARGIN.top + plotH);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }, [fromA, hoverIndex, labels, palette, plotH, plotW, samples, toA]);

  const readout = (() => {
    if (hoverIndex === null) return labels.hoverHint;
    const s = samples[hoverIndex];
    if (!s) return labels.hoverHint;
    const [sep, frc, cur, len] = s.shares;
    return (
      `I = ${s.currentA.toFixed(1)} A  ·  F = ${s.forceMn.toFixed(2)} mN  ·  ` +
      `${labels.total} = ${s.totalPct.toFixed(1)} %  ·  ` +
      `${labels.separation} ${sep.toFixed(0)} %  ·  ` +
      `${labels.force} ${frc.toFixed(0)} %  ·  ` +
      `${labels.current} ${cur.toFixed(0)} %  ·  ` +
      `${labels.length} ${len.toFixed(0)} %`
    );
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
        <div
          role="slider"
          tabIndex={0}
          aria-label={labels.shareAxis}
          aria-valuemin={0}
          aria-valuemax={SAMPLES - 1}
          aria-valuenow={hoverIndex ?? 0}
          aria-valuetext={readout}
          className="absolute inset-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          style={{ pointerEvents: "none" }}
          onFocus={() =>
            setHoverIndex((prev) => prev ?? Math.floor(SAMPLES / 2))
          }
          onKeyDown={handleKeyDown}
        />
      </div>
      <p className="font-mono text-xs text-zinc-600 dark:text-zinc-300">
        {readout}
      </p>
    </div>
  );
}
