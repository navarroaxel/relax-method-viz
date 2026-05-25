"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export type SimMode = "2d" | "3d";

interface ModeToggleProps {
  mode: SimMode;
  onChange: (m: SimMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const { t } = useLanguage();
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-700">
      {(["2d", "3d"] as const).map((m) => {
        const active = m === mode;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              active
                ? "bg-blue-600 text-white"
                : "bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            }`}
          >
            {m === "2d" ? t("mode.2d") : t("mode.3d")}
          </button>
        );
      })}
    </div>
  );
}
