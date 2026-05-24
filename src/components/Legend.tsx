"use client";

import { useLanguage } from "@/contexts/LanguageContext";

interface LegendProps {
  vmax: number;
}

export function Legend({ vmax }: LegendProps) {
  const { t } = useLanguage();
  const vmaxLabel = vmax > 0 ? vmax.toFixed(0) : "—";
  return (
    <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
      <span className="font-medium">{t("legend.title")}</span>
      <div className="flex flex-col gap-1">
        <div
          className="h-3 w-full rounded-sm border border-zinc-300 dark:border-zinc-700"
          style={{
            background:
              "linear-gradient(to right, rgb(55, 138, 221), white, rgb(224, 75, 74))",
          }}
        />
        <div className="flex justify-between font-mono text-xs text-zinc-600 dark:text-zinc-400">
          <span>−{vmaxLabel}</span>
          <span>0</span>
          <span>+{vmaxLabel}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ backgroundColor: "#791F1F" }}
          />
          +V
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ backgroundColor: "#0C447C" }}
          />
          −V
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ backgroundColor: "#2C2C2A" }}
          />
          {t("legend.ground")}
        </span>
      </div>
    </div>
  );
}
