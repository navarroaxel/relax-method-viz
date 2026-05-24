"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type ThemeMode = "auto" | "light" | "dark";

const STORAGE_KEY = "theme";

function readStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "auto";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" ? v : "auto";
}

function applyMode(mode: ThemeMode): void {
  if (typeof window === "undefined") return;
  const systemDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;
  const useDark = mode === "dark" || (mode === "auto" && systemDark);
  document.documentElement.classList.toggle("dark", useDark);
  if (mode === "auto") {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, mode);
  }
}

const ORDER: ThemeMode[] = ["auto", "light", "dark"];
const ICONS: Record<ThemeMode, string> = {
  auto: "🌗",
  light: "☀️",
  dark: "🌙",
};

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("auto");
  const [mounted, setMounted] = useState(false);
  const { t } = useLanguage();
  const prefix = t("theme.label");
  const labels: Record<ThemeMode, string> = {
    auto: `${prefix} Auto`,
    light: `${prefix} Light`,
    dark: `${prefix} Dark`,
  };

  useEffect(() => {
    // Read external state (localStorage) on mount and reflect it in UI.
    // We must also re-call applyMode here: the layout's inline script set the
    // .dark class pre-hydration, but React hydration reconciles <html>'s
    // className back to its SSR value and strips it. Re-asserting after mount
    // restores the class so the dark theme actually sticks.
    const stored = readStoredMode();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(stored);
    applyMode(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mode !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyMode("auto");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  const cycle = () => {
    setMode((prev) => {
      const next = ORDER[(ORDER.indexOf(prev) + 1) % ORDER.length] as ThemeMode;
      applyMode(next);
      return next;
    });
  };

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={labels[mode]}
      title={labels[mode]}
      suppressHydrationWarning
      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      <span aria-hidden>{mounted ? ICONS[mode] : ICONS.auto}</span>
      <span>{mounted ? labels[mode].replace(`${prefix} `, "") : "Auto"}</span>
    </button>
  );
}
