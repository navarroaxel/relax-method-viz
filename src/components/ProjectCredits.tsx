"use client";

import { useLanguage } from "@/contexts/LanguageContext";

const MEMBERS = [
  "COALI, Juan",
  "MORENO, Franco",
  "Ing. NAVARRO, Axel",
  "SAA, Santiago",
  "SCALERANDI GOMEZ, Santiago",
  "VÁZQUEZ, Hernán",
];

export function ProjectCredits() {
  const { t } = useLanguage();
  return (
    <footer className="rounded-md border border-zinc-200 bg-white p-4 text-xs leading-relaxed text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
      <header className="mb-3 border-b border-zinc-200 pb-2 dark:border-zinc-700">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Trabajo Práctico · Teoría de los Campos · UTN · FRBA
        </p>
        <h2 className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {t("credits.subtitle")}
        </h2>
      </header>
      <p className="mb-3 dark:text-zinc-200">
        {t("credits.description")}
      </p>
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        <div>
          <h3 className="mb-1 font-medium text-zinc-700 dark:text-zinc-100">{t("credits.teachers")}</h3>
          <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5">
            <dt className="text-zinc-500 dark:text-zinc-200">{t("credits.full_professor")}</dt>
            <dd>Ing. RECCHINI, Jorge</dd>
            <dt className="text-zinc-500 dark:text-zinc-200">{t("credits.lab_head")}</dt>
            <dd>Ing. MUIÑO, Federico</dd>
          </dl>
        </div>
        <div>
          <h3 className="mb-1 font-medium text-zinc-700 dark:text-zinc-100">
            {t("credits.members")}
          </h3>
          <ul className="ml-4 list-disc">
            {MEMBERS.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
