"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { applyFixedValues, idx, paintBrush, paintStroke } from "@/lib/grid";
import { renderAll } from "@/lib/rendering";
import type { DisplayFlags, GridState, Tool } from "@/types";

interface CanvasProps {
  grid: GridState;
  display: DisplayFlags;
  tool: Tool;
  voltage: number;
  brushSize: number;
  displaySize: number;
  renderTick: number;
  onPaint: () => void;
  canvasRef?: RefObject<HTMLCanvasElement | null>;
}

interface HoverInfo {
  i: number;
  j: number;
  V: number;
  E: number;
}

export function Canvas({
  grid,
  display,
  tool,
  voltage,
  brushSize,
  displaySize,
  renderTick,
  onPaint,
  canvasRef: externalCanvasRef,
}: CanvasProps) {
  const internalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = externalCanvasRef ?? internalCanvasRef;
  const isDrawingRef = useRef(false);
  const lastCellRef = useRef<{ i: number; j: number } | null>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);

  const stateRef = useRef({ tool, voltage, brushSize, grid });
  useEffect(() => {
    stateRef.current = { tool, voltage, brushSize, grid };
  }, [tool, voltage, brushSize, grid]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderAll(ctx, grid, display, displaySize);
  }, [canvasRef, grid, display, displaySize, renderTick]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const toCell = (clientX: number, clientY: number): { i: number; j: number } => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const { grid } = stateRef.current;
      const cellSize = rect.width / grid.N;
      const i = Math.floor(x / cellSize);
      const j = Math.floor(y / cellSize);
      return { i, j };
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

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isDrawingRef.current = true;
      lastCellRef.current = null;
      const { i, j } = toCell(e.clientX, e.clientY);
      paintAt(i, j);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (isDrawingRef.current) {
        const { i, j } = toCell(e.clientX, e.clientY);
        paintAt(i, j);
        updateHover(e.clientX, e.clientY);
        return;
      }
      updateHover(e.clientX, e.clientY);
    };
    const onCanvasMouseLeave = () => {
      setHover(null);
    };
    const onMouseUp = () => {
      isDrawingRef.current = false;
      lastCellRef.current = null;
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      e.preventDefault();
      isDrawingRef.current = true;
      lastCellRef.current = null;
      const { i, j } = toCell(t.clientX, t.clientY);
      paintAt(i, j);
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t || !isDrawingRef.current) return;
      e.preventDefault();
      const { i, j } = toCell(t.clientX, t.clientY);
      paintAt(i, j);
    };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      isDrawingRef.current = false;
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
  }, [canvasRef, onPaint]);

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
