"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { applyFixedValues, paintBrush, paintStroke } from "@/lib/grid";
import { renderAll, renderTrace, type TraceShape } from "@/lib/rendering";
import { sampleE, sampleV } from "@/lib/sampling";
import type { DisplayFlags, GridState, Tool } from "@/types";

interface CanvasProps {
  grid: GridState;
  display: DisplayFlags;
  tool: Tool;
  voltage: number;
  brushSize: number;
  paintPhaseRad: number;
  displaySize: number;
  renderTick: number;
  vmax: number;
  emax: number;
  trace: TraceShape | null;
  traceDraft: TraceShape | null;
  onPaint: () => void;
  onPaintEnd?: () => void;
  onTraceChange: (trace: TraceShape | null) => void;
  onTraceDraftChange: (draft: TraceShape | null) => void;
  canvasRef?: RefObject<HTMLCanvasElement | null>;
}

interface HoverInfo {
  i: number;
  j: number;
  V: number;
  E: number;
  ex: number;
  ey: number;
}

const CURVE_MIN_STEP = 0.5; // grid cells between recorded points

export function Canvas({
  grid,
  display,
  tool,
  voltage,
  brushSize,
  paintPhaseRad,
  displaySize,
  renderTick,
  vmax,
  emax,
  trace,
  traceDraft,
  onPaint,
  onPaintEnd,
  onTraceChange,
  onTraceDraftChange,
  canvasRef: externalCanvasRef,
}: CanvasProps) {
  const internalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = externalCanvasRef ?? internalCanvasRef;
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const isPaintingRef = useRef(false);
  const lastCellRef = useRef<{ i: number; j: number } | null>(null);
  const isCurveDrawingRef = useRef(false);
  const curvePointsRef = useRef<Array<[number, number]>>([]);
  const [hover, setHover] = useState<HoverInfo | null>(null);

  const stateRef = useRef({ tool, voltage, brushSize, paintPhaseRad, grid, trace, traceDraft });
  useEffect(() => {
    stateRef.current = { tool, voltage, brushSize, paintPhaseRad, grid, trace, traceDraft };
  }, [tool, voltage, brushSize, paintPhaseRad, grid, trace, traceDraft]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderAll(ctx, grid, display, displaySize, vmax);
    const cellSize = displaySize / grid.N;
    renderTrace(ctx, trace, traceDraft, cellSize);
  }, [canvasRef, grid, display, displaySize, renderTick, vmax, trace, traceDraft]);

  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!hover || hover.E < 1e-6) return;

    const cellSize = displaySize / grid.N;
    const cx = (hover.i + 0.5) * cellSize;
    const cy = (hover.j + 0.5) * cellSize;
    const ux = hover.ex / hover.E;
    const uy = hover.ey / hover.E;
    const MAX_L = cellSize * 5;
    const L = Math.min(hover.E / emax, 1) * MAX_L;
    const x1 = cx - ux * L * 0.35;
    const y1 = cy - uy * L * 0.35;
    const x2 = cx + ux * L * 0.65;
    const y2 = cy + uy * L * 0.65;

    ctx.save();
    ctx.strokeStyle = "#fbbf24";
    ctx.fillStyle = "#fbbf24";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    const angle = Math.atan2(uy, ux);
    const hl = cellSize * 0.7;
    const ha = Math.PI / 6;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - hl * Math.cos(angle - ha), y2 - hl * Math.sin(angle - ha));
    ctx.lineTo(x2 - hl * Math.cos(angle + ha), y2 - hl * Math.sin(angle + ha));
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, [hover, emax, displaySize, grid.N]);

  // Cancel any in-progress trace when the tool changes.
  useEffect(() => {
    isCurveDrawingRef.current = false;
    curvePointsRef.current = [];
    if (tool !== "line") onTraceDraftChange(null);
  }, [tool, onTraceDraftChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const toFracCell = (
      clientX: number,
      clientY: number,
    ): { x: number; y: number } => {
      const rect = canvas.getBoundingClientRect();
      const { grid } = stateRef.current;
      const cellSize = rect.width / grid.N;
      return {
        x: (clientX - rect.left) / cellSize,
        y: (clientY - rect.top) / cellSize,
      };
    };

    const toCell = (
      clientX: number,
      clientY: number,
    ): { i: number; j: number } => {
      const { x, y } = toFracCell(clientX, clientY);
      return { i: Math.floor(x), j: Math.floor(y) };
    };

    const paintAt = (i: number, j: number) => {
      const { grid, tool, voltage, brushSize, paintPhaseRad } = stateRef.current;
      const last = lastCellRef.current;
      if (last) {
        paintStroke(grid, last.i, last.j, i, j, brushSize, tool, voltage, paintPhaseRad);
      } else {
        paintBrush(grid, i, j, brushSize, tool, voltage, paintPhaseRad);
      }
      applyFixedValues(grid);
      lastCellRef.current = { i, j };
      onPaint();
    };

    const updateHover = (clientX: number, clientY: number) => {
      const { grid } = stateRef.current;
      const { x, y } = toFracCell(clientX, clientY);
      const i = Math.floor(x);
      const j = Math.floor(y);
      if (i < 0 || i >= grid.N || j < 0 || j >= grid.N) {
        setHover(null);
        return;
      }
      const { ex, ey, mag } = sampleE(grid.V, grid.N, x, y);
      const V = sampleV(grid.V, grid.N, x, y);
      setHover({ i, j, V, E: mag, ex, ey });
    };

    // ---- trace handlers ------------------------------------------------
    const handleLineDown = (x: number, y: number) => {
      const { traceDraft } = stateRef.current;
      const draftStart = traceDraft?.points[0];
      if (!draftStart) {
        onTraceDraftChange({ kind: "line", points: [[x, y]] });
        return;
      }
      // Second click on (approximately) the start cell commits a probe;
      // otherwise commits a 2-point line.
      const dx = x - (draftStart[0] as number);
      const dy = y - (draftStart[1] as number);
      if (Math.hypot(dx, dy) < 0.5) {
        onTraceChange({
          kind: "line",
          points: [[draftStart[0], draftStart[1]]],
        });
      } else {
        onTraceChange({
          kind: "line",
          points: [[draftStart[0], draftStart[1]], [x, y]],
        });
      }
      onTraceDraftChange(null);
    };

    const handleLineMove = (x: number, y: number) => {
      const { traceDraft } = stateRef.current;
      const draftStart = traceDraft?.points[0];
      if (!draftStart) return;
      onTraceDraftChange({
        kind: "line",
        points: [[draftStart[0], draftStart[1]], [x, y]],
      });
    };

    const handleCurveDown = (x: number, y: number) => {
      isCurveDrawingRef.current = true;
      curvePointsRef.current = [[x, y]];
      onTraceChange(null);
      onTraceDraftChange({ kind: "curve", points: [[x, y]] });
    };

    const handleCurveMove = (x: number, y: number) => {
      if (!isCurveDrawingRef.current) return;
      const pts = curvePointsRef.current;
      const last = pts[pts.length - 1];
      if (last && Math.hypot(x - last[0], y - last[1]) < CURVE_MIN_STEP) return;
      pts.push([x, y]);
      onTraceDraftChange({ kind: "curve", points: pts.slice() });
    };

    const handleCurveUp = () => {
      if (!isCurveDrawingRef.current) return;
      isCurveDrawingRef.current = false;
      const pts = curvePointsRef.current;
      if (pts.length >= 2) {
        onTraceChange({ kind: "curve", points: pts });
      } else if (pts.length === 1) {
        // Mousedown without drag — commit as a probe (1-point trace).
        onTraceChange({ kind: "curve", points: pts });
      }
      curvePointsRef.current = [];
      onTraceDraftChange(null);
    };

    // ---- pointer events -----------------------------------------------
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const { tool } = stateRef.current;
      const { x, y } = toFracCell(e.clientX, e.clientY);
      if (tool === "line") {
        handleLineDown(x, y);
        return;
      }
      if (tool === "curve") {
        handleCurveDown(x, y);
        return;
      }
      isPaintingRef.current = true;
      lastCellRef.current = null;
      const { i, j } = toCell(e.clientX, e.clientY);
      paintAt(i, j);
    };

    const onMouseMove = (e: MouseEvent) => {
      const { tool } = stateRef.current;
      if (tool === "line") {
        const { x, y } = toFracCell(e.clientX, e.clientY);
        handleLineMove(x, y);
        updateHover(e.clientX, e.clientY);
        return;
      }
      if (tool === "curve") {
        if (isCurveDrawingRef.current) {
          const { x, y } = toFracCell(e.clientX, e.clientY);
          handleCurveMove(x, y);
        }
        updateHover(e.clientX, e.clientY);
        return;
      }
      if (isPaintingRef.current) {
        const { i, j } = toCell(e.clientX, e.clientY);
        paintAt(i, j);
      }
      updateHover(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      const { tool } = stateRef.current;
      if (tool === "curve") {
        handleCurveUp();
        return;
      }
      if (isPaintingRef.current) onPaintEnd?.();
      isPaintingRef.current = false;
      lastCellRef.current = null;
    };

    const onCanvasMouseLeave = () => {
      setHover(null);
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      e.preventDefault();
      updateHover(t.clientX, t.clientY);
      const { tool } = stateRef.current;
      const { x, y } = toFracCell(t.clientX, t.clientY);
      if (tool === "line") {
        handleLineDown(x, y);
        return;
      }
      if (tool === "curve") {
        handleCurveDown(x, y);
        return;
      }
      isPaintingRef.current = true;
      lastCellRef.current = null;
      const { i, j } = toCell(t.clientX, t.clientY);
      paintAt(i, j);
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      e.preventDefault();
      updateHover(t.clientX, t.clientY);
      const { tool } = stateRef.current;
      if (tool === "line") {
        const { x, y } = toFracCell(t.clientX, t.clientY);
        handleLineMove(x, y);
        return;
      }
      if (tool === "curve") {
        if (isCurveDrawingRef.current) {
          const { x, y } = toFracCell(t.clientX, t.clientY);
          handleCurveMove(x, y);
        }
        return;
      }
      if (!isPaintingRef.current) return;
      const { i, j } = toCell(t.clientX, t.clientY);
      paintAt(i, j);
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const { tool } = stateRef.current;
      if (tool === "curve") {
        handleCurveUp();
        return;
      }
      if (isPaintingRef.current) onPaintEnd?.();
      isPaintingRef.current = false;
      lastCellRef.current = null;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onCanvasMouseLeave);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    canvas.addEventListener("touchcancel", onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onCanvasMouseLeave);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [canvasRef, onPaint, onPaintEnd, onTraceChange, onTraceDraftChange]);

  return (
    <div
      className="relative aspect-square w-full"
      style={{ maxWidth: displaySize }}
    >
      <canvas
        ref={canvasRef}
        width={displaySize}
        height={displaySize}
        className="block h-full w-full rounded-md border border-zinc-300 bg-white shadow-sm touch-none select-none dark:border-zinc-700"
      />
      <canvas
        ref={overlayRef}
        width={displaySize}
        height={displaySize}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      {hover && (
        <div className="pointer-events-none absolute right-2 top-2 rounded-md border border-zinc-200 bg-white/90 px-2 py-1 font-mono text-[11px] leading-tight text-zinc-700 shadow-sm backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-200">
          <div>
            ({hover.i}, {hover.j})
          </div>
          <div>V = {hover.V.toFixed(2)}</div>
          <div>
            E = ({hover.ex.toFixed(2)}, {hover.ey.toFixed(2)})
          </div>
          <div>|E| = {hover.E.toFixed(3)}</div>
          <div>
            θ = {(Math.atan2(hover.ey, hover.ex) * (180 / Math.PI)).toFixed(1)}°
          </div>
        </div>
      )}
    </div>
  );
}
