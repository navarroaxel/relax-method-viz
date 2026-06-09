"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useLanguage, type Language } from "@/contexts/LanguageContext";

export type SimMode = "2d" | "3d";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type ThemeMode = "auto" | "light" | "dark";

const THEME_STORAGE_KEY = "theme";

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "auto";
  const v = window.localStorage.getItem(THEME_STORAGE_KEY);
  return v === "light" || v === "dark" ? v : "auto";
}

function applyTheme(mode: ThemeMode): void {
  if (typeof window === "undefined") return;
  const systemDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;
  const useDark = mode === "dark" || (mode === "auto" && systemDark);
  document.documentElement.classList.toggle("dark", useDark);
  if (mode === "auto") {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
  } else {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  }
}

const THEME_ORDER: ThemeMode[] = ["auto", "light", "dark"];
const THEME_ICONS: Record<ThemeMode, string> = {
  auto: "🌗",
  light: "☀️",
  dark: "🌙",
};

const segBtn = (active: boolean) =>
  `px-2.5 py-1 text-xs font-medium transition-colors ${
    active
      ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
      : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
  }`;

interface SettingsPanelProps {
  mode: SimMode;
  onModeChange: (m: SimMode) => void;
}

export function SettingsPanel({ mode, onModeChange }: SettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("auto");
  const [themeMounted, setThemeMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { language, toggle: toggleLanguage, t } = useLanguage();

  useIsomorphicLayoutEffect(() => {
    const stored = readStoredTheme();
    setThemeMode(stored);
    applyTheme(stored);
    setThemeMounted(true);
  }, []);

  useEffect(() => {
    if (themeMode !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("auto");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [themeMode]);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const currentTheme = themeMounted ? themeMode : "auto";
  const setLanguage = (next: Language) => {
    if (next !== language) toggleLanguage();
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("settings.aria")}
        title={t("settings.aria")}
        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <span aria-hidden>⚙</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-60 space-y-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {t("settings.section_display")}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 dark:text-zinc-300">
                {t("settings.mode_label")}
              </span>
              <div className="flex overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-700">
                {(["2d", "3d"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onModeChange(m)}
                    className={segBtn(mode === m)}
                  >
                    {m === "2d" ? t("mode.2d") : t("mode.3d")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {t("settings.section_interface")}
            </p>

            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-zinc-600 dark:text-zinc-300">
                {t("settings.lang_label")}
              </span>
              <div className="flex overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-700">
                {(["es", "en"] as Language[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setLanguage(v)}
                    className={`${segBtn(language === v)} font-mono`}
                  >
                    {v.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 dark:text-zinc-300">
                {t("theme.label")}
              </span>
              <div className="flex overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-700">
                {THEME_ORDER.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      setThemeMode(v);
                      applyTheme(v);
                    }}
                    title={`${t("theme.label")} ${v}`}
                    suppressHydrationWarning
                    className={segBtn(currentTheme === v)}
                  >
                    {THEME_ICONS[v]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
