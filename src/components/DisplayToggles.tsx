"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import type { DisplayFlags } from "@/types";

interface DisplayTogglesProps {
  display: DisplayFlags;
  onChange: (next: DisplayFlags) => void;
}

export function DisplayToggles({ display, onChange }: DisplayTogglesProps) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-md border border-zinc-200 bg-white p-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
      <span className="font-medium">{t("display.show")}</span>
      <label className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={display.heatmap}
          onChange={(e) =>
            onChange({ ...display, heatmap: e.target.checked })
          }
        />
        {t("display.heatmap")}
      </label>
      <label className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={display.equipotentials}
          onChange={(e) =>
            onChange({ ...display, equipotentials: e.target.checked })
          }
        />
        {t("display.equipotentials")}
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
        {t("display.streamlines")}
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
        {t("display.arrows")}
      </label>
      <label className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={display.surface3D}
          onChange={(e) =>
            onChange({ ...display, surface3D: e.target.checked })
          }
        />
        {t("display.surface3d")}
      </label>
    </div>
  );
}
