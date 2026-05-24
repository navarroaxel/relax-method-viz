"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { applyFixedValues, idx, paintBrush, paintStroke } from "@/lib/grid";
import { renderAll, renderTrace, type TraceShape } from "@/lib/rendering";
import type { DisplayFlags, GridState, Tool } from "@/types";

interface CanvasProps {
  grid: GridState;
  display: DisplayFlags;
  tool: Tool;
  voltage: number;
  brushSize: number;
  displaySize: number;
  renderTick: number;
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
}

const CURVE_MIN_STEP = 0.5; // grid cells between recorded points

export function Canvas({
  grid,
  display,
  tool,
  voltage,
  brushSize,
  displaySize,
  renderTick,
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
  const isPaintingRef = useRef(false);
  const lastCellRef = useRef<{ i: number; j: number } | null>(null);
  const isCurveDrawingRef = useRef(false);
  const curvePointsRef = useRef<Array<[number, number]>>([]);
  const [hover, setHover] = useState<HoverInfo | null>(null);

  const stateRef = useRef({ tool, voltage, brushSize, grid, trace, traceDraft });
  useEffect(() => {
    stateRef.current = { tool, voltage, brushSize, grid, trace, traceDraft };
  }, [tool, voltage, brushSize, grid, trace, traceDraft]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderAll(ctx, grid, display, displaySize);
    const cellSize = displaySize / grid.N;
    renderTrace(ctx, trace, traceDraft, cellSize);
  }, [canvasRef, grid, display, displaySize, renderTick, trace, traceDraft]);

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
      const { grid, tool, voltage, brushSize } = stateRef.current;
      const last = lastCellRef.current;
      if (last) {
        paintStroke(grid, last.i, last.j, i, j, brushSize, tool, voltage);
      } else {
        paintBrush(grid, i, j, brushSize, tool, voltage);
      }
      applyFixedValues(grid);
      lastCellRef.current = { i, j };
      onPaint();
    };

    const updateHover = (clientX: number, clientY: number) => {
      const { grid } = stateRef.current;
      const { i, j } = toCell(clientX, clientY);
      if (i < 0 || i >= grid.N || j < 0 || j >= grid.N) {
        setHover(null);
        return;
      }
      const k = idx(i, j, grid.N);
      const V = grid.V[k] as number;
      let E = 0;
      if (i > 0 && i < grid.N - 1 && j > 0 && j < grid.N - 1) {
        const vR = grid.V[idx(i + 1, j, grid.N)] as number;
        const vL = grid.V[idx(i - 1, j, grid.N)] as number;
        const vD = grid.V[idx(i, j + 1, grid.N)] as number;
        const vU = grid.V[idx(i, j - 1, grid.N)] as number;
        const ex = -(vR - vL) * 0.5;
        const ey = -(vD - vU) * 0.5;
        E = Math.sqrt(ex * ex + ey * ey);
      }
      setHover({ i, j, V, E });
    };

    // ---- trace handlers ------------------------------------------------
    const handleLineDown = (x: number, y: number) => {
      const { traceDraft } = stateRef.current;
      const draftStart = traceDraft?.points[0];
      if (!draftStart) {
        onTraceDraftChange({ kind: "line", points: [[x, y]] });
        return;
      }
      // Finalize: draft has the start point; this click is the end.
      onTraceChange({
        kind: "line",
        points: [[draftStart[0], draftStart[1]], [x, y]],
      });
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
      {hover && (
        <div className="pointer-events-none absolute right-2 top-2 rounded-md border border-zinc-200 bg-white/90 px-2 py-1 font-mono text-[11px] leading-tight text-zinc-700 shadow-sm backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-200">
          <div>
            ({hover.i}, {hover.j})
          </div>
          <div>V = {hover.V.toFixed(2)}</div>
          <div>|E| = {hover.E.toFixed(3)}</div>
        </div>
      )}
    </div>
  );
}
