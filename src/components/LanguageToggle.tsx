"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export function LanguageToggle() {
  const { language, toggle, t } = useLanguage();
  const target = language === "es" ? "EN" : "ES";
  const aria = t("language.switch_aria");

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={aria}
      title={aria}
      className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {target}
    </button>
  );
}
