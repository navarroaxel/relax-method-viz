"use client";

import type { DisplayFlags } from "@/types";

interface DisplayTogglesProps {
  display: DisplayFlags;
  onChange: (next: DisplayFlags) => void;
}

export function DisplayToggles({ display, onChange }: DisplayTogglesProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-md border border-zinc-200 bg-white p-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
      <span className="font-medium">Mostrar:</span>
      <label className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={display.heatmap}
          onChange={(e) =>
            onChange({ ...display, heatmap: e.target.checked })
          }
        />
        Potencial
      </label>
      <label className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={display.equipotentials}
          onChange={(e) =>
            onChange({ ...display, equipotentials: e.target.checked })
          }
        />
        Equipotenciales
      </label>
      <label className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={display.arrows}
          onChange={(e) =>
            onChange({
              ...display,
              arrows: e.target.checked,
              streamlines: e.target.checked ? false : display.streamlines,
            })
          }
        />
        Campo E (flechas)
      </label>
      <label className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={display.streamlines}
          onChange={(e) =>
            onChange({
              ...display,
              streamlines: e.target.checked,
              arrows: e.target.checked ? false : display.arrows,
            })
          }
        />
        Líneas de campo
      </label>
      <label className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={display.surface3D}
          onChange={(e) =>
            onChange({ ...display, surface3D: e.target.checked })
          }
        />
        Superficie 3D
      </label>
    </div>
  );
}
