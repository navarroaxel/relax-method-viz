"use client";

import { PRESETS, PRESET_ORDER, type PresetId } from "@/lib/presets";

interface PresetSelectProps {
  value: PresetId | "custom";
  onApply: (id: PresetId) => void;
}

export function PresetSelect({ value, onApply }: PresetSelectProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-200 bg-white p-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
      <label className="flex items-center gap-2">
        <span className="font-medium">Preset:</span>
        <select
          value={value}
          onChange={(e) => {
            const next = e.target.value;
            if (next === "custom") return;
            onApply(next as PresetId);
          }}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="custom" disabled>
            — Personalizado —
          </option>
          {PRESET_ORDER.map((id) => (
            <option key={id} value={id}>
              {PRESETS[id].label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
