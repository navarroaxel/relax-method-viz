"use client";

import Link from "next/link";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { GitHubLink } from "@/components/GitHubLink";
import { MethodExplanation } from "@/components/MethodExplanation";
import { ProjectCredits } from "@/components/ProjectCredits";
import { SettingsPanel, type SimMode } from "@/components/SettingsPanel";
import { Simulator } from "@/components/Simulator";
import { Simulator3D } from "@/components/Simulator3D";
import { useLanguage } from "@/contexts/LanguageContext";
import { readShareFromUrl } from "@/lib/share";

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

  // A shared link may target the other mode than the one stored/hydrated.
  // Flip the mode store once, post-mount, so the matching <Simulator*> mounts
  // and applies the preset + strips the URL itself (see Simulator/Simulator3D
  // mount effects). Child effects run before parent effects, so the
  // initially-mounted wrong-mode simulator sees the mismatch and no-ops
  // (without stripping the URL) before this switches the mode.
  useEffect(() => {
    const s = readShareFromUrl();
    if (s && s.mode !== mode) change(s.mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-3 p-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {t("page.title")}
          </h1>
          <div className="flex items-center gap-2">
            <GitHubLink />
            <SettingsPanel mode={mode} onModeChange={change} />
          </div>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-200">
          {t("page.description")}
        </p>
        <div className="flex flex-col gap-1">
          <Link
            href="/lab1"
            className="text-xs text-blue-700 hover:underline dark:text-blue-400"
          >
            {t("page.lab1_link")}
          </Link>
          <Link
            href="/lab2"
            className="text-xs text-blue-700 hover:underline dark:text-blue-400"
          >
            {t("page.lab2_link")}
          </Link>
        </div>
      </header>
      {mode === "2d" ? <Simulator /> : <Simulator3D />}
      <MethodExplanation />
      <ProjectCredits />
    </main>
  );
}
