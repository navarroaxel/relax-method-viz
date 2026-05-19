"use client";

interface RunControlsProps {
  isRunning: boolean;
  onToggleRun: () => void;
  onStep: () => void;
  onResetPotential: () => void;
  onClear: () => void;
}

export function RunControls({
  isRunning,
  onToggleRun,
  onStep,
  onResetPotential,
  onClear,
}: RunControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
      <button
        type="button"
        onClick={onToggleRun}
        className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        {isRunning ? "Pausar" : "Calcular"}
      </button>
      <button
        type="button"
        onClick={onStep}
        disabled={isRunning}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        Paso (50)
      </button>
      <button
        type="button"
        onClick={onResetPotential}
        disabled={isRunning}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        Reset V
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={isRunning}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        Limpiar
      </button>
    </div>
  );
}
