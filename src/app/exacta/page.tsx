"use client";

import Link from "next/link";
import { AnalyticalPanel } from "@/components/AnalyticalPanel";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ExactaPage() {
  const { t } = useLanguage();
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-3 p-4">
      <header className="flex flex-col gap-2">
        <div>
          <Link
            href="/"
            className="text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            {t("analytical.back")}
          </Link>
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {t("analytical.title")}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-200">
          {t("analytical.page_description")}
        </p>
      </header>
      <AnalyticalPanel />
    </main>
  );
}
