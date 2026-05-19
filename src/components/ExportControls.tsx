"use client";

interface ExportControlsProps {
  onOpenSaveLoad: () => void;
  onExportPNG: () => void;
}

export function ExportControls({
  onOpenSaveLoad,
  onExportPNG,
}: ExportControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
      <button
        type="button"
        onClick={onOpenSaveLoad}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        Guardar / Cargar
      </button>
      <button
        type="button"
        onClick={onExportPNG}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        Exportar PNG
      </button>
    </div>
  );
}
