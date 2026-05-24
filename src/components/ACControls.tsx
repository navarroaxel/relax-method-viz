"use client";

import { useLanguage } from "@/contexts/LanguageContext";

interface ACControlsProps {
  enabled: boolean;
  periodSec: number;
  phaseRad: number;
  onToggleEnabled: (v: boolean) => void;
  onChangePeriodSec: (p: number) => void;
}

const TWO_PI = 2 * Math.PI;

export function ACControls({
  enabled,
  periodSec,
  phaseRad,
  onToggleEnabled,
  onChangePeriodSec,
}: ACControlsProps) {
  const { t } = useLanguage();
  const wrappedRad = enabled ? ((phaseRad % TWO_PI) + TWO_PI) % TWO_PI : 0;
  const cycleDeg = Math.round((wrappedRad * 180) / Math.PI);
  const factor = enabled ? Math.sin(phaseRad) : 1;
  const freqHz = periodSec > 0 ? 1 / periodSec : 0;

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
          min={0.1}
          max={60}
          step={0.1}
          value={periodSec}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n >= 0.1) onChangePeriodSec(n);
          }}
          disabled={!enabled}
          className="w-20 rounded border border-zinc-300 bg-white px-2 py-1 text-sm disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          s · {freqHz.toFixed(2)} Hz
        </span>
      </label>
      {enabled && (
        <span className="font-mono text-xs text-zinc-600 dark:text-zinc-300">
          ωt = {cycleDeg}° · sin(ωt) = {factor.toFixed(2)}
        </span>
      )}
    </div>
  );
}
