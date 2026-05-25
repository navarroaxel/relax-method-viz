"use client";

import { useCallback, useSyncExternalStore } from "react";
import { GitHubLink } from "@/components/GitHubLink";
import { LanguageToggle } from "@/components/LanguageToggle";
import { MethodExplanation } from "@/components/MethodExplanation";
import { ModeToggle, type SimMode } from "@/components/ModeToggle";
import { ProjectCredits } from "@/components/ProjectCredits";
import { Simulator } from "@/components/Simulator";
import { Simulator3D } from "@/components/Simulator3D";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLanguage } from "@/contexts/LanguageContext";

const STORAGE_KEY = "relax-viz:mode";
const STORE_EVENT = "relax-viz:mode-change";

function readMode(): SimMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "3d" ? "3d" : "2d";
}

function subscribe(cb: () => void): () => void {
  window.addEventListener(STORE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(STORE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function SimulatorRoot() {
  const { t } = useLanguage();
  // Match the static export (Spanish-language landing) by defaulting to 2D
  // on the server; the client reads localStorage during hydration via
  // useSyncExternalStore.
  const mode = useSyncExternalStore<SimMode>(subscribe, readMode, () => "2d");

  const change = useCallback((m: SimMode) => {
    localStorage.setItem(STORAGE_KEY, m);
    window.dispatchEvent(new Event(STORE_EVENT));
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-3 p-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {t("page.title")}
          </h1>
          <div className="flex items-center gap-2">
            <ModeToggle mode={mode} onChange={change} />
            <LanguageToggle />
            <GitHubLink />
            <ThemeToggle />
          </div>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-200">
          {t("page.description")}
        </p>
      </header>
      {mode === "2d" ? <Simulator /> : <Simulator3D />}
      <MethodExplanation />
      <ProjectCredits />
    </main>
  );
}
