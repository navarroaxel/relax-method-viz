"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ShareButton } from "@/components/ShareButton";
import { Toolbar3D } from "@/components/Toolbar3D";
import { Viewport3D } from "@/components/Viewport3DDynamic";
import {
  applyFixedValues3D,
  clearAll3D,
  createGrid3D,
  resetPotential3D,
} from "@/lib/grid3d";
import { applyPrimitive3D } from "@/lib/primitives3d";
import { DEFAULT_SOLVER_CONFIG_3D } from "@/lib/relaxation3d";
import { computeVmax3D } from "@/lib/rendering3d";
import {
  apply as applyPreset3D,
  PRESETS_3D,
  type Preset3DId,
} from "@/lib/presets3d";
import { buildShareUrl, clearShareParam, readShareFromUrl } from "@/lib/share";
import type {
  Grid3DState,
  Primitive3D,
  SliceAxis,
  Tool3D,
} from "@/types/grid3d";
import type { Worker3DInbound, Worker3DOutbound } from "@/types/worker3d";

const DEFAULT_N = 60;
const MANUAL_STEP = 20;
const GRID_OPTIONS = [40, 60, 80] as const;

export function Simulator3D() {
  const { t } = useLanguage();
  const [grid, setGrid] = useState<Grid3DState>(() => createGrid3D(DEFAULT_N));
  const workerRef = useRef<Worker | null>(null);

  const [tool, setTool] = useState<Tool3D>("plate");
  const [voltage, setVoltage] = useState(100);
  const [thickness, setThickness] = useState(2);
  const [radius, setRadius] = useState(4);
  const [sliceAxis, setSliceAxis] = useState<SliceAxis>("z");
  const [sliceIndex, setSliceIndex] = useState(Math.floor(DEFAULT_N / 2));
  const [omega, setOmega] = useState(DEFAULT_SOLVER_CONFIG_3D.omega);
  const [isRunning, setIsRunning] = useState(false);
  const [iteration, setIteration] = useState(0);
  const [deltaMax, setDeltaMax] = useState(Number.POSITIVE_INFINITY);
  const [renderTick, setRenderTick] = useState(0);
  const [conductorVersion, setConductorVersion] = useState(0);
  const [preset, setPreset] = useState<Preset3DId | "custom">("custom");
  const [showEquipotentials, setShowEquipotentials] = useState(true);
  const [showFieldLines, setShowFieldLines] = useState(true);

  const bumpRender = useCallback(() => setRenderTick((v) => v + 1), []);
  const bumpConductors = useCallback(
    () => setConductorVersion((v) => v + 1),
    [],
  );

  const post = useCallback(
    (msg: Worker3DInbound, transfer: Transferable[] = []) => {
      workerRef.current?.postMessage(msg, transfer);
    },
    [],
  );

  const postUpdateFixed = useCallback(() => {
    const f = new Uint8Array(grid.fixed);
    const v = new Float32Array(grid.Vfix);
    post({ type: "updateFixed", fixed: f, Vfix: v }, [f.buffer, v.buffer]);
  }, [grid, post]);

  useEffect(() => {
    const w = new Worker(
      new URL("../workers/solver3d.worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = w;
    w.onmessage = (e: MessageEvent<Worker3DOutbound>) => {
      const msg = e.data;
      grid.V = msg.V;
      setIteration(msg.iteration);
      setDeltaMax(msg.deltaMax);
      bumpRender();
      if (msg.type === "done") setIsRunning(false);
    };
    const f = new Uint8Array(grid.fixed);
    const v = new Float32Array(grid.Vfix);
    w.postMessage({ type: "init", N: grid.N, fixed: f, Vfix: v }, [
      f.buffer,
      v.buffer,
    ]);
    return () => {
      w.terminate();
      workerRef.current = null;
    };
  }, [grid, bumpRender]);

  const vmax = useMemo(
    () => computeVmax3D(grid.V),
    // grid.V is mutated in place; renderTick is the change signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [grid, renderTick],
  );

  const handleCommitPrimitive = useCallback(
    (prim: Primitive3D, erase: boolean) => {
      applyPrimitive3D(grid, prim, erase);
      applyFixedValues3D(grid);
      setIteration(0);
      setDeltaMax(Number.POSITIVE_INFINITY);
      setPreset("custom");
      bumpRender();
      bumpConductors();
      postUpdateFixed();
    },
    [grid, bumpRender, bumpConductors, postUpdateFixed],
  );

  const handleToggleRun = () => {
    setIsRunning((r) => {
      const next = !r;
      if (next) post({ type: "run", config: { ...DEFAULT_SOLVER_CONFIG_3D, omega } });
      else post({ type: "pause" });
      return next;
    });
  };

  const handleStep = () => {
    if (isRunning) return;
    post({ type: "step", omega, count: MANUAL_STEP });
  };

  const handleResetPotential = () => {
    resetPotential3D(grid);
    setIteration(0);
    setDeltaMax(Number.POSITIVE_INFINITY);
    post({ type: "reset" });
    bumpRender();
  };

  const handleClear = () => {
    clearAll3D(grid);
    setIteration(0);
    setDeltaMax(Number.POSITIVE_INFINITY);
    setPreset("custom");
    postUpdateFixed();
    post({ type: "reset" });
    bumpRender();
    bumpConductors();
  };

  const handleChangeN = (n: number) => {
    setIsRunning(false);
    const g = createGrid3D(n);
    setGrid(g);
    setSliceIndex(Math.floor(n / 2));
    setIteration(0);
    setDeltaMax(Number.POSITIVE_INFINITY);
    setPreset("custom");
    bumpConductors();
  };

  const handleApplyPreset = (id: Preset3DId) => {
    if (isRunning) {
      post({ type: "pause" });
      setIsRunning(false);
    }
    applyPreset3D(id, grid);
    setPreset(id);
    setIteration(0);
    setDeltaMax(Number.POSITIVE_INFINITY);
    postUpdateFixed();
    post({ type: "reset" });
    bumpRender();
    bumpConductors();
  };

  // Restore a shared preset link (?mode=3d&preset=...) once, after mount. Placed after
  // the worker-init effect and handleApplyPreset (so workerRef is set and
  // handleApplyPreset is already defined by the time this posts to the
  // worker). A 2D share link is handled by Simulator's matching effect; if
  // we're not the matching mode here, do nothing and don't strip.
  useEffect(() => {
    const s = readShareFromUrl();
    if (!s || s.mode !== "3d") return;
    // One-time hydration of view state from a shared link on mount, not a
    // derived-state loop — the recommended exception to this rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowEquipotentials(s.display.equipotentials);
    setShowFieldLines(s.display.fieldLines);
    handleApplyPreset(s.preset);
    clearShareParam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAutoOmega = () => {
    setOmega(parseFloat((2 / (1 + Math.sin(Math.PI / grid.N))).toFixed(3)));
  };

  const deltaLabel = Number.isFinite(deltaMax) ? deltaMax.toExponential(2) : "—";

  return (
    <>
      <Toolbar3D
        tool={tool}
        voltage={voltage}
        thickness={thickness}
        radius={radius}
        sliceAxis={sliceAxis}
        onToolChange={setTool}
        onVoltageChange={setVoltage}
        onThicknessChange={setThickness}
        onRadiusChange={setRadius}
        onSliceAxisChange={setSliceAxis}
      />
      <div className="flex flex-wrap items-center gap-4 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <span>{t("preset3d.label")}</span>
          <select
            value={preset}
            onChange={(e) => {
              const v = e.target.value as Preset3DId | "custom";
              if (v !== "custom") handleApplyPreset(v);
              else setPreset("custom");
            }}
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="custom">{t("preset.custom")}</option>
            {(Object.keys(PRESETS_3D) as Preset3DId[]).map((id) => (
              <option key={id} value={id}>
                {t(PRESETS_3D[id].labelKey)}
              </option>
            ))}
          </select>
        </label>
        <ShareButton
          disabled={preset === "custom"}
          getUrl={() =>
            buildShareUrl({
              mode: "3d",
              preset: preset as Preset3DId,
              display: {
                equipotentials: showEquipotentials,
                fieldLines: showFieldLines,
              },
            })
          }
        />
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={showEquipotentials}
            onChange={(e) => setShowEquipotentials(e.target.checked)}
          />
          <span>{t("display.equipotentials")}</span>
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={showFieldLines}
            onChange={(e) => setShowFieldLines(e.target.checked)}
          />
          <span>{t("display.streamlines")}</span>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
        <button
          type="button"
          onClick={handleToggleRun}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
        >
          {isRunning ? t("run.pause") : t("run.calculate")}
        </button>
        <button
          type="button"
          onClick={handleStep}
          disabled={isRunning}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        >
          {t("run.step")}
        </button>
        <button
          type="button"
          onClick={handleResetPotential}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        >
          {t("run.reset_v")}
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        >
          {t("run.clear")}
        </button>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <span>ω =</span>
          <span className="font-mono">{omega.toFixed(3)}</span>
          <input
            type="range"
            min={1.0}
            max={1.99}
            step={0.01}
            value={omega}
            onChange={(e) => setOmega(parseFloat(e.target.value))}
            className="w-32"
          />
          <button
            type="button"
            onClick={handleAutoOmega}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {t("run.auto")}
          </button>
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <span>{t("run.grid")}</span>
          <select
            value={grid.N}
            onChange={(e) => handleChangeN(parseInt(e.target.value, 10))}
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {GRID_OPTIONS.map((n) => (
              <option key={n} value={n}>{`${n}³`}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex justify-center">
        <Viewport3D
          grid={grid}
          renderTick={renderTick}
          conductorVersion={conductorVersion}
          vmax={vmax || 1}
          tool={tool}
          voltage={voltage}
          thickness={thickness}
          radius={radius}
          sliceAxis={sliceAxis}
          sliceIndex={sliceIndex}
          setSliceIndex={setSliceIndex}
          showEquipotentials={showEquipotentials}
          showFieldLines={showFieldLines}
          onCommitPrimitive={handleCommitPrimitive}
        />
      </div>
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
          {DEFAULT_SOLVER_CONFIG_3D.tolerance}
        </span>
      </div>
    </>
  );
}
