"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@/components/Canvas";
import { DisplayToggles } from "@/components/DisplayToggles";
import { ExportControls } from "@/components/ExportControls";
import { Legend } from "@/components/Legend";
import { PresetSelect } from "@/components/PresetSelect";
import { ProjectCredits } from "@/components/ProjectCredits";
import { RunControls } from "@/components/RunControls";
import { SaveLoadDialog } from "@/components/SaveLoadDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Toolbar } from "@/components/Toolbar";
import { clearAll, createGrid, resetPotential } from "@/lib/grid";
import { PRESETS, type PresetId } from "@/lib/presets";
import { DEFAULT_SOLVER_CONFIG } from "@/lib/relaxation";
import { computeVmax } from "@/lib/rendering";
import { applyGeometryToGrid } from "@/lib/storage";
import type { DisplayFlags, GridState, SavedGeometry, Tool } from "@/types";
import type { WorkerInbound, WorkerOutbound } from "@/types/worker";

const DISPLAY_SIZE = 480;
const MANUAL_STEP = 50;

export function Simulator() {
  const [grid, setGrid] = useState<GridState>(() => createGrid(120, "dirichlet0"));
  const workerRef = useRef<Worker | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [tool, setTool] = useState<Tool>("pos");
  const [voltage, setVoltage] = useState(50);
  const [brushSize, setBrushSize] = useState(2);
  const [display, setDisplay] = useState<DisplayFlags>({
    heatmap: true,
    equipotentials: true,
    arrows: true,
  });
  const [omega, setOmega] = useState(DEFAULT_SOLVER_CONFIG.omega);
  const [isRunning, setIsRunning] = useState(false);
  const [iteration, setIteration] = useState(0);
  const [deltaMax, setDeltaMax] = useState(Number.POSITIVE_INFINITY);
  const [renderTick, setRenderTick] = useState(0);
  const [presetId, setPresetId] = useState<PresetId | "custom">("custom");
  const [dialogOpen, setDialogOpen] = useState(false);

  const bumpRender = useCallback(() => setRenderTick((t) => t + 1), []);

  const post = useCallback(
    (msg: WorkerInbound, transfer: Transferable[] = []) => {
      workerRef.current?.postMessage(msg, transfer);
    },
    [],
  );

  const postUpdateFixed = useCallback(() => {
    const f = new Uint8Array(grid.fixed);
    const v = new Float32Array(grid.Vfix);
    post(
      { type: "updateFixed", fixed: f, Vfix: v },
      [f.buffer, v.buffer],
    );
  }, [grid, post]);

  useEffect(() => {
    const w = new Worker(
      new URL("../workers/solver.worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = w;

    w.onmessage = (e: MessageEvent<WorkerOutbound>) => {
      const msg = e.data;
      grid.V = msg.V;
      setIteration(msg.iteration);
      setDeltaMax(msg.deltaMax);
      bumpRender();
      if (msg.type === "done") {
        setIsRunning(false);
      }
    };

    const f = new Uint8Array(grid.fixed);
    const v = new Float32Array(grid.Vfix);
    w.postMessage(
      {
        type: "init",
        N: grid.N,
        boundary: grid.boundary,
        fixed: f,
        Vfix: v,
      },
      [f.buffer, v.buffer],
    );

    return () => {
      w.terminate();
      workerRef.current = null;
    };
  }, [grid, bumpRender]);

  const handleToggleRun = () => {
    setIsRunning((r) => {
      const next = !r;
      if (next) {
        post({ type: "run", config: { ...DEFAULT_SOLVER_CONFIG, omega } });
      } else {
        post({ type: "pause" });
      }
      return next;
    });
  };

  const handleStep = () => {
    if (isRunning) return;
    post({
      type: "step",
      omega,
      count: MANUAL_STEP,
    });
  };

  const handleResetPotential = () => {
    resetPotential(grid);
    setIteration(0);
    setDeltaMax(Number.POSITIVE_INFINITY);
    post({ type: "reset" });
    bumpRender();
  };

  const handleAutoOmega = () => {
    setOmega(parseFloat((2 / (1 + Math.sin(Math.PI / grid.N))).toFixed(3)));
  };

  const handleChangeN = (n: number) => {
    setIsRunning(false);
    setGrid(createGrid(n, "dirichlet0"));
    setPresetId("custom");
    setIteration(0);
    setDeltaMax(Number.POSITIVE_INFINITY);
  };

  const handleClear = () => {
    clearAll(grid);
    setPresetId("custom");
    setIteration(0);
    setDeltaMax(Number.POSITIVE_INFINITY);
    postUpdateFixed();
    post({ type: "reset" });
    bumpRender();
  };

  const handleApplyPreset = (id: PresetId) => {
    if (isRunning) {
      post({ type: "pause" });
      setIsRunning(false);
    }
    PRESETS[id].apply(grid);
    setPresetId(id);
    setIteration(0);
    setDeltaMax(Number.POSITIVE_INFINITY);
    postUpdateFixed();
    post({ type: "reset" });
    bumpRender();
  };

  const handlePaint = useCallback(() => {
    setPresetId("custom");
    setIteration(0);
    setDeltaMax(Number.POSITIVE_INFINITY);
    bumpRender();
  }, [bumpRender]);

  const handlePaintEnd = useCallback(() => {
    postUpdateFixed();
  }, [postUpdateFixed]);

  const handleLoadGeometry = (geometry: SavedGeometry) => {
    if (isRunning) {
      post({ type: "pause" });
      setIsRunning(false);
    }
    applyGeometryToGrid(grid, geometry);
    setPresetId("custom");
    setIteration(0);
    setDeltaMax(Number.POSITIVE_INFINITY);
    postUpdateFixed();
    post({ type: "reset" });
    bumpRender();
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "campo.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const deltaLabel = Number.isFinite(deltaMax)
    ? deltaMax.toExponential(2)
    : "—";

  // grid.V is mutated in place; renderTick is the change signal.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const vmax = useMemo(() => computeVmax(grid.V), [grid, renderTick]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-3 p-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Campo Eléctrico — Método de Relax
          </h1>
          <ThemeToggle />
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-200">
          Dibujá conductores en el lienzo, asignales un potencial, y mirá cómo
          se forma el campo electrostático mientras el solver SOR converge.
        </p>
      </header>
      <Toolbar
        tool={tool}
        voltage={voltage}
        brushSize={brushSize}
        onToolChange={setTool}
        onVoltageChange={setVoltage}
        onBrushChange={setBrushSize}
      />
      <PresetSelect value={presetId} onApply={handleApplyPreset} />
      <DisplayToggles display={display} onChange={setDisplay} />
      <RunControls
        isRunning={isRunning}
        gridN={grid.N}
        omega={omega}
        onToggleRun={handleToggleRun}
        onStep={handleStep}
        onResetPotential={handleResetPotential}
        onClear={handleClear}
        onChangeN={handleChangeN}
        onChangeOmega={setOmega}
        onAutoOmega={handleAutoOmega}
      />
      <ExportControls
        onOpenSaveLoad={() => setDialogOpen(true)}
        onExportPNG={handleExportPNG}
      />
      <div className="flex justify-center">
        <Canvas
          grid={grid}
          display={display}
          tool={tool}
          voltage={voltage}
          brushSize={brushSize}
          displaySize={DISPLAY_SIZE}
          renderTick={renderTick}
          onPaint={handlePaint}
          onPaintEnd={handlePaintEnd}
          canvasRef={canvasRef}
        />
      </div>
      <Legend vmax={vmax} />
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white p-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
        <div className="flex flex-wrap gap-4">
          <span>
            Iteración: <span className="font-mono">{iteration}</span>
          </span>
          <span>
            Δmax: <span className="font-mono">{deltaLabel}</span>
          </span>
        </div>
        <span className="text-zinc-500 dark:text-zinc-400">
          ω = {omega} · tolerancia ={" "}
          {DEFAULT_SOLVER_CONFIG.tolerance}
        </span>
      </div>
      <footer className="rounded-md border border-zinc-200 bg-white p-3 text-xs leading-relaxed text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
        El método de relajación resuelve ∇²V = 0 discretizando el plano en una
        grilla cuadrada y reemplazando iterativamente cada nodo no fijo por el
        promedio de sus cuatro vecinos. Con sobre-relajación sucesiva (SOR),
        cada nodo se actualiza como{" "}
        <span className="font-mono">V ← V + ω · (promedio − V)</span>, con ω ≈
        1.9 para esta grilla. El campo se obtiene después por{" "}
        <span className="font-mono">E = −∇V</span> con diferencias centradas.
      </footer>
      <ProjectCredits />
      {dialogOpen && (
        <SaveLoadDialog
          onClose={() => setDialogOpen(false)}
          grid={grid}
          onLoad={handleLoadGeometry}
        />
      )}
    </main>
  );
}
