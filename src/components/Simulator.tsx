"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ACControls } from "@/components/ACControls";
import { Canvas } from "@/components/Canvas";
import { DisplayToggles } from "@/components/DisplayToggles";
import { ExportControls } from "@/components/ExportControls";
import { Legend } from "@/components/Legend";
import { PresetSelect } from "@/components/PresetSelect";
import { ProjectCredits } from "@/components/ProjectCredits";
import { RunControls } from "@/components/RunControls";
import { SaveLoadDialog } from "@/components/SaveLoadDialog";
import { GitHubLink } from "@/components/GitHubLink";
import { LanguageToggle } from "@/components/LanguageToggle";
import {
  makeProbeHistory,
  pushProbeSample,
  StripChart,
  type ProbeHistory,
} from "@/components/StripChart";
import { Surface3D } from "@/components/Surface3DDynamic";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Toolbar } from "@/components/Toolbar";
import { TraceChart } from "@/components/TraceChart";
import { applyFixedValues, clearAll, createGrid, resetPotential } from "@/lib/grid";
import { PRESETS, type PresetId } from "@/lib/presets";
import { DEFAULT_SOLVER_CONFIG } from "@/lib/relaxation";
import { computeFieldStats, type TraceShape } from "@/lib/rendering";
import { sampleE, sampleTrace, sampleV } from "@/lib/sampling";
import { applyGeometryToGrid } from "@/lib/storage";
import { useLanguage } from "@/contexts/LanguageContext";
import type { BoundaryCondition, DisplayFlags, GridState, SavedGeometry, Tool } from "@/types";
import type { WorkerInbound, WorkerOutbound } from "@/types/worker";

const TRACE_SAMPLE_STEP = 0.5;

const DISPLAY_SIZE = 480;
const MANUAL_STEP = 50;

export function Simulator() {
  const [grid, setGrid] = useState<GridState>(() => createGrid(120, "neumann"));
  const workerRef = useRef<Worker | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [tool, setTool] = useState<Tool>("pos");
  const [voltage, setVoltage] = useState(100);
  const [brushSize, setBrushSize] = useState(2);
  const [paintPhaseDeg, setPaintPhaseDeg] = useState(0);
  const [acEnabled, setAcEnabled] = useState(false);
  const [acPeriodSec, setAcPeriodSec] = useState(2);
  const [acPhaseRad, setAcPhaseRad] = useState(0);
  const [display, setDisplay] = useState<DisplayFlags>({
    heatmap: true,
    equipotentials: true,
    arrows: false,
    streamlines: true,
    surface3D: false,
  });
  const [omega, setOmega] = useState(DEFAULT_SOLVER_CONFIG.omega);
  const [isRunning, setIsRunning] = useState(false);
  const [iteration, setIteration] = useState(0);
  const [deltaMax, setDeltaMax] = useState(Number.POSITIVE_INFINITY);
  const [renderTick, setRenderTick] = useState(0);
  const [presetId, setPresetId] = useState<PresetId | "custom">("custom");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [trace, setTrace] = useState<TraceShape | null>(null);
  const [traceDraft, setTraceDraft] = useState<TraceShape | null>(null);
  const probeHistoryRef = useRef<ProbeHistory>(makeProbeHistory());
  const traceRef = useRef<TraceShape | null>(trace);
  useEffect(() => {
    traceRef.current = trace;
  }, [trace]);

  const { t } = useLanguage();

  const clearProbeHistory = useCallback(() => {
    probeHistoryRef.current = makeProbeHistory();
  }, []);

  const handleTraceChange = useCallback(
    (next: TraceShape | null) => {
      // Replacing the trace invalidates the previous probe history.
      clearProbeHistory();
      setTrace(next);
    },
    [clearProbeHistory],
  );

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
    const p = new Float32Array(grid.phase);
    post(
      { type: "updateFixed", fixed: f, Vfix: v, phase: p },
      [f.buffer, v.buffer, p.buffer],
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
      setAcPhaseRad(msg.acPhaseRad);
      const tr = traceRef.current;
      if (tr && tr.points.length === 1) {
        const p = tr.points[0] as readonly [number, number];
        const v = sampleV(grid.V, grid.N, p[0] as number, p[1] as number);
        const eMag = sampleE(grid.V, grid.N, p[0] as number, p[1] as number).mag;
        pushProbeSample(probeHistoryRef.current, performance.now(), v, eMag);
      }
      bumpRender();
      if (msg.type === "done") {
        setIsRunning(false);
      }
    };

    const f = new Uint8Array(grid.fixed);
    const v = new Float32Array(grid.Vfix);
    const p = new Float32Array(grid.phase);
    w.postMessage(
      {
        type: "init",
        N: grid.N,
        boundary: grid.boundary,
        fixed: f,
        Vfix: v,
        phase: p,
      },
      [f.buffer, v.buffer, p.buffer],
    );

    return () => {
      w.terminate();
      workerRef.current = null;
    };
  }, [grid, bumpRender]);

  // Push AC config to the worker whenever it changes (and after re-init).
  useEffect(() => {
    post({ type: "setAC", ac: { enabled: acEnabled, periodSec: acPeriodSec } });
  }, [acEnabled, acPeriodSec, post, grid]);

  // Toggling AC changes V(t) regime — old samples mix DC and AC physics.
  useEffect(() => {
    clearProbeHistory();
  }, [acEnabled, clearProbeHistory]);

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
    clearProbeHistory();
    post({ type: "reset" });
    bumpRender();
  };

  const handleAutoOmega = () => {
    setOmega(parseFloat((2 / (1 + Math.sin(Math.PI / grid.N))).toFixed(3)));
  };

  const handleChangeN = (n: number) => {
    setIsRunning(false);
    setGrid(createGrid(n, grid.boundary));
    setPresetId("custom");
    setIteration(0);
    setDeltaMax(Number.POSITIVE_INFINITY);
    setTrace(null);
    setTraceDraft(null);
    clearProbeHistory();
  };

  const handleChangeBoundary = (b: BoundaryCondition) => {
    setIsRunning(false);
    const newGrid = createGrid(grid.N, b);
    newGrid.fixed.set(grid.fixed);
    newGrid.Vfix.set(grid.Vfix);
    newGrid.phase.set(grid.phase);
    applyFixedValues(newGrid);
    setGrid(newGrid);
    setIteration(0);
    setDeltaMax(Number.POSITIVE_INFINITY);
  };

  const handleClear = () => {
    clearAll(grid);
    setPresetId("custom");
    setIteration(0);
    setDeltaMax(Number.POSITIVE_INFINITY);
    setTrace(null);
    setTraceDraft(null);
    clearProbeHistory();
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
    setTrace(null);
    setTraceDraft(null);
    clearProbeHistory();
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
    if (geometry.N !== grid.N) {
      const newGrid = createGrid(geometry.N, grid.boundary);
      applyGeometryToGrid(newGrid, geometry);
      setGrid(newGrid);
    } else {
      applyGeometryToGrid(grid, geometry);
    }
    setPresetId("custom");
    setIteration(0);
    setDeltaMax(Number.POSITIVE_INFINITY);
    setTrace(null);
    setTraceDraft(null);
    clearProbeHistory();
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

  const { vmax, emax } = useMemo(
    () => computeFieldStats(grid.V, grid.N),
    // grid.V is mutated in place; renderTick is the change signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [grid, renderTick],
  );

  const traceSamples = useMemo(
    () =>
      trace && trace.points.length >= 2
        ? sampleTrace(grid, trace.points, TRACE_SAMPLE_STEP)
        : null,
    // grid.V is mutated in place; renderTick is the change signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trace, grid, renderTick],
  );

  const handleClearTrace = useCallback(() => {
    clearProbeHistory();
    setTrace(null);
    setTraceDraft(null);
  }, [clearProbeHistory]);

  const isTraceTool = tool === "line" || tool === "curve";
  const isProbe = trace !== null && trace.points.length === 1;
  const isProfile = trace !== null && trace.points.length >= 2;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-3 p-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {t("page.title")}
          </h1>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <GitHubLink />
            <ThemeToggle />
          </div>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-200">
          {t("page.description")}
        </p>
      </header>
      <Toolbar
        tool={tool}
        voltage={voltage}
        brushSize={brushSize}
        paintPhaseDeg={paintPhaseDeg}
        showPhase={acEnabled}
        onToolChange={setTool}
        onVoltageChange={setVoltage}
        onBrushChange={setBrushSize}
        onPaintPhaseChange={setPaintPhaseDeg}
      />
      <PresetSelect value={presetId} onApply={handleApplyPreset} />
      <DisplayToggles display={display} onChange={setDisplay} />
      <RunControls
        isRunning={isRunning}
        gridN={grid.N}
        omega={omega}
        boundary={grid.boundary}
        onToggleRun={handleToggleRun}
        onStep={handleStep}
        onResetPotential={handleResetPotential}
        onClear={handleClear}
        onChangeN={handleChangeN}
        onChangeOmega={setOmega}
        onAutoOmega={handleAutoOmega}
        onChangeBoundary={handleChangeBoundary}
      />
      <ACControls
        enabled={acEnabled}
        periodSec={acPeriodSec}
        phaseRad={acPhaseRad}
        onToggleEnabled={setAcEnabled}
        onChangePeriodSec={setAcPeriodSec}
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
          paintPhaseRad={(paintPhaseDeg * Math.PI) / 180}
          displaySize={DISPLAY_SIZE}
          renderTick={renderTick}
          vmax={vmax}
          trace={trace}
          traceDraft={traceDraft}
          onPaint={handlePaint}
          onPaintEnd={handlePaintEnd}
          onTraceChange={handleTraceChange}
          onTraceDraftChange={setTraceDraft}
          canvasRef={canvasRef}
        />
      </div>
      {acEnabled && (
        <div className="flex justify-center">
          <StripChart
            mode="ac"
            acPhaseRad={acPhaseRad}
            acPeriodSec={acPeriodSec}
          />
        </div>
      )}
      {isProbe && (
        <div className="flex justify-center">
          <StripChart
            mode="probe"
            historyRef={probeHistoryRef}
            renderTick={renderTick}
            vScale={vmax}
            eScale={emax}
            onClear={handleClearTrace}
          />
        </div>
      )}
      {(isProfile || (isTraceTool && !isProbe)) && (
        <div className="flex justify-center">
          <TraceChart
            samples={traceSamples}
            vScale={vmax}
            eScale={emax}
            onClear={handleClearTrace}
          />
        </div>
      )}
      {display.surface3D && (
        <div className="flex justify-center">
          <Surface3D grid={grid} renderTick={renderTick} vmax={vmax} />
        </div>
      )}
      <Legend vmax={vmax} />
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white p-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
        <div className="flex flex-wrap gap-4">
          <span>
            {t("stats.iteration")} <span className="font-mono">{iteration}</span>
          </span>
          <span>
            Δmax: <span className="font-mono">{deltaLabel}</span>
          </span>
        </div>
        <span className="text-zinc-500 dark:text-zinc-400">
          ω = {omega} · {t("stats.tolerance")} ={" "}
          {DEFAULT_SOLVER_CONFIG.tolerance}
        </span>
      </div>
      <footer className="rounded-md border border-zinc-200 bg-white p-3 text-xs leading-relaxed text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
        {t("footer.part1")}{" "}
        <span className="font-mono">V ← V + ω · ({t("footer.average")} − V)</span>
        {t("footer.part2")}{" "}
        <span className="font-mono">E = −∇V</span>{" "}
        {t("footer.part3")}
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
