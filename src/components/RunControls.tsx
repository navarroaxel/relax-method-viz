"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import type { BoundaryCondition } from "@/types";

const GRID_SIZES = [80, 120, 200] as const;

interface RunControlsProps {
  isRunning: boolean;
  gridN: number;
  omega: number;
  boundary: BoundaryCondition;
  onToggleRun: () => void;
  onStep: () => void;
  onResetPotential: () => void;
  onClear: () => void;
  onChangeN: (n: number) => void;
  onChangeOmega: (omega: number) => void;
  onAutoOmega: () => void;
  onChangeBoundary: (b: BoundaryCondition) => void;
}

export function RunControls({
  isRunning,
  gridN,
  omega,
  boundary,
  onToggleRun,
  onStep,
  onResetPotential,
  onClear,
  onChangeN,
  onChangeOmega,
  onAutoOmega,
  onChangeBoundary,
}: RunControlsProps) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
      <button
        type="button"
        onClick={onToggleRun}
        className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        {isRunning ? t("run.pause") : t("run.calculate")}
      </button>
      <button
        type="button"
        onClick={onStep}
        disabled={isRunning}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        {t("run.step")}
      </button>
      <button
        type="button"
        onClick={onResetPotential}
        disabled={isRunning}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        {t("run.reset_v")}
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={isRunning}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        {t("run.clear")}
      </button>
      <label className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
        ω = <span className="w-10 font-mono">{omega.toFixed(3)}</span>
        <input
          type="range"
          min="1.0"
          max="1.999"
          step="0.001"
          value={omega}
          onChange={(e) => onChangeOmega(Number(e.target.value))}
          className="w-28"
        />
        <button
          type="button"
          onClick={onAutoOmega}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
        >
          {t("run.auto")}
        </button>
      </label>
      <label className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
        {t("run.boundary")}
        <select
          value={boundary}
          onChange={(e) =>
            onChangeBoundary(e.target.value as BoundaryCondition)
          }
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="dirichlet">Dirichlet (V = 0)</option>
          <option value="neumann">Neumann (∂V/∂n = 0)</option>
        </select>
      </label>
      <label className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
        {t("run.grid")}
        <select
          value={gridN}
          onChange={(e) => onChangeN(Number(e.target.value))}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {GRID_SIZES.map((n) => (
            <option key={n} value={n}>
              {n}×{n}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
