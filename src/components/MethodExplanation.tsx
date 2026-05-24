"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export function MethodExplanation() {
  const { t } = useLanguage();
  return (
    <section className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-3 text-xs leading-relaxed text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
      <p>
        {t("explanation.relax.part1")}{" "}
        <span className="font-mono">
          V ← V + ω · ({t("explanation.relax.average")} − V)
        </span>
        {t("explanation.relax.part2")}{" "}
        <span className="font-mono">E = −∇V</span>{" "}
        {t("explanation.relax.part3")}
      </p>
      <p>{t("explanation.trace")}</p>
      <p>{t("explanation.ac")}</p>
    </section>
  );
}
