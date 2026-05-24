"use client";

import { useLanguage } from "@/contexts/LanguageContext";

interface ACControlsProps {
  enabled: boolean;
  period: number;
  iteration: number;
  onToggleEnabled: (v: boolean) => void;
  onChangePeriod: (p: number) => void;
}

export function ACControls({
  enabled,
  period,
  iteration,
  onToggleEnabled,
  onChangePeriod,
}: ACControlsProps) {
  const { t } = useLanguage();
  const cycleFraction = enabled
    ? ((iteration % Math.max(1, period)) / Math.max(1, period))
    : 0;
  const cycleDeg = Math.round(cycleFraction * 360);
  const factor = enabled ? Math.sin(2 * Math.PI * cycleFraction) : 1;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
      <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggleEnabled(e.target.checked)}
          className="h-4 w-4"
        />
        {t("ac.enable")}
      </label>
      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <span>{t("ac.period")}</span>
        <input
          type="number"
          min={20}
          max={5000}
          step={10}
          value={period}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n >= 20) onChangePeriod(Math.round(n));
          }}
          disabled={!enabled}
          className="w-24 rounded border border-zinc-300 bg-white px-2 py-1 text-sm disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {t("ac.iter_per_cycle")}
        </span>
      </label>
      {enabled && (
        <span className="font-mono text-xs text-zinc-600 dark:text-zinc-300">
          ωt = {cycleDeg}° · sin = {factor.toFixed(2)}
        </span>
      )}
    </div>
  );
}
