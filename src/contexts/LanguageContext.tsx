"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";

export type Language = "es" | "en";

const STORAGE_KEY = "language";
const STORE_EVENT = "relax-viz:language-change";

const ES = {
  "language.switch_aria": "Cambiar a inglés",

  "page.title": "Campo Eléctrico — Método de Relax",
  "page.description":
    "Dibujá conductores en el lienzo, asignales un potencial, y mirá cómo se forma el campo electrostático mientras el solver SOR converge.",

  "toolbar.tool": "Herramienta:",
  "toolbar.potential": "Potencial:",
  "toolbar.brush": "Pincel:",
  "toolbar.phase": "Fase:",
  "toolbar.tool_pos": "+V",
  "toolbar.tool_neg": "−V",
  "toolbar.tool_gnd": "Tierra (0)",
  "toolbar.tool_era": "Borrar",
  "toolbar.tool_line": "Traza recta",
  "toolbar.tool_curve": "Curva libre",
  "toolbar.custom_voltage": "personalizado",

  "trace.title": "Perfil sobre la traza",
  "trace.clear": "Borrar traza",
  "trace.empty_hint":
    "Elegí Traza recta (dos clics) o Curva libre (arrastrar) y dibujá sobre el lienzo.",
  "trace.axis_v": "V",
  "trace.axis_e": "|E|",
  "trace.axis_s": "s (celdas)",

  "display.show": "Mostrar:",
  "display.heatmap": "Potencial",
  "display.equipotentials": "Equipotenciales",
  "display.streamlines": "Líneas de campo",
  "display.arrows": "Campo E (flechas)",
  "display.surface3d": "Superficie 3D",

  "run.calculate": "Calcular",
  "run.pause": "Pausar",
  "run.step": "Paso (50)",
  "run.reset_v": "Reset V",
  "run.clear": "Limpiar",
  "run.boundary": "Contorno",
  "run.grid": "Grilla",
  "run.auto": "Auto",

  "ac.enable": "Modulación AC",
  "ac.period": "Período:",
  "ac.iter_per_cycle": "iter/ciclo",

  "preset.custom": "— Personalizado —",
  "preset.parallel": "Capacitor plano",
  "preset.dipole": "Dipolo",
  "preset.lightning": "Pararrayos simplificado",
  "preset.coaxial": "Cable Coaxial",
  "preset.faraday": "Jaula de Faraday",
  "preset.tip": "Punta vs plano",
  "preset.conductors": "Placas conductoras",
  "preset.subconductors": "Línea 4 subconductores",

  "export.save_load": "Guardar / Cargar",
  "export.png": "Exportar PNG",

  "legend.title": "Referencia",
  "legend.ground": "Tierra",

  "stats.iteration": "Iteración:",
  "stats.tolerance": "tolerancia",

  "footer.part1":
    "El método de relajación resuelve ∇²V = 0 discretizando el plano en una grilla cuadrada y reemplazando iterativamente cada nodo no fijo por el promedio de sus cuatro vecinos. Con sobre-relajación sucesiva (SOR), cada nodo se actualiza como",
  "footer.average": "promedio",
  "footer.part2":
    ", con ω ≈ 1.9 para esta grilla. El campo se obtiene después por",
  "footer.part3": "con diferencias centradas.",

  "credits.subtitle":
    "Cálculo de potenciales en forma numérica — Método de Relax",
  "credits.description":
    "Simulador interactivo desarrollado como apoyo didáctico para visualizar la convergencia del método de relax (SOR) sobre geometrías electrostáticas en 2D, en el marco de la cátedra.",
  "credits.teachers": "Docentes",
  "credits.full_professor": "Profesor Titular",
  "credits.lab_head": "Jefe de Trabajos Prácticos",
  "credits.members": "Integrantes del grupo",

  "dialog.title": "Guardar / Cargar geometría",
  "dialog.name_placeholder": "Nombre",
  "dialog.save": "Guardar",
  "dialog.export_json": "Exportar JSON",
  "dialog.import_json": "Importar JSON",
  "dialog.empty": "No hay geometrías guardadas todavía.",
  "dialog.cells": "celdas",
  "dialog.load": "Cargar",
  "dialog.delete": "Borrar",
  "dialog.close_aria": "Cerrar",
  "dialog.error_name": "Poné un nombre para guardar.",
  "dialog.error_json": "Archivo JSON inválido.",
  "dialog.error_read": "No se pudo leer el archivo.",

  "github.aria": "Repositorio en GitHub",

  "theme.label": "Tema:",
} as const;

type TranslationKey = keyof typeof ES;

const EN: Record<TranslationKey, string> = {
  "language.switch_aria": "Switch to Spanish",

  "page.title": "Electric Field — Relaxation Method",
  "page.description":
    "Draw conductors on the canvas, assign them a potential, and watch the electrostatic field form as the SOR solver converges.",

  "toolbar.tool": "Tool:",
  "toolbar.potential": "Potential:",
  "toolbar.brush": "Brush:",
  "toolbar.phase": "Phase:",
  "toolbar.tool_pos": "+V",
  "toolbar.tool_neg": "−V",
  "toolbar.tool_gnd": "Ground (0)",
  "toolbar.tool_era": "Erase",
  "toolbar.tool_line": "Straight trace",
  "toolbar.tool_curve": "Free curve",
  "toolbar.custom_voltage": "custom",

  "trace.title": "Profile along the trace",
  "trace.clear": "Clear trace",
  "trace.empty_hint":
    "Pick Straight trace (two clicks) or Free curve (drag) and draw on the canvas.",
  "trace.axis_v": "V",
  "trace.axis_e": "|E|",
  "trace.axis_s": "s (cells)",

  "display.show": "Show:",
  "display.heatmap": "Potential",
  "display.equipotentials": "Equipotentials",
  "display.streamlines": "Field lines",
  "display.arrows": "E field (arrows)",
  "display.surface3d": "3D Surface",

  "run.calculate": "Calculate",
  "run.pause": "Pause",
  "run.step": "Step (50)",
  "run.reset_v": "Reset V",
  "run.clear": "Clear",
  "run.boundary": "Boundary",
  "run.grid": "Grid",
  "run.auto": "Auto",

  "ac.enable": "AC modulation",
  "ac.period": "Period:",
  "ac.iter_per_cycle": "iter/cycle",

  "preset.custom": "— Custom —",
  "preset.parallel": "Parallel plate capacitor",
  "preset.dipole": "Dipole",
  "preset.lightning": "Lightning rod (simplified)",
  "preset.coaxial": "Coaxial cable",
  "preset.faraday": "Faraday cage",
  "preset.tip": "Tip vs plane",
  "preset.conductors": "Conducting plates",
  "preset.subconductors": "4-subconductor line",

  "export.save_load": "Save / Load",
  "export.png": "Export PNG",

  "legend.title": "Legend",
  "legend.ground": "Ground",

  "stats.iteration": "Iteration:",
  "stats.tolerance": "tolerance",

  "footer.part1":
    "The relaxation method solves ∇²V = 0 by discretizing the plane onto a square grid and iteratively replacing each free node with the average of its four neighbors. With successive over-relaxation (SOR), each node is updated as",
  "footer.average": "average",
  "footer.part2": ", with ω ≈ 1.9 for this grid. The field is then obtained by",
  "footer.part3": "using centered differences.",

  "credits.subtitle":
    "Numerical potential computation — Relaxation Method",
  "credits.description":
    "Interactive simulator developed as a teaching aid to visualize the convergence of the relaxation method (SOR) on 2D electrostatic geometries, in the context of the course.",
  "credits.teachers": "Teachers",
  "credits.full_professor": "Full Professor",
  "credits.lab_head": "Lab Instructor",
  "credits.members": "Group members",

  "dialog.title": "Save / Load geometry",
  "dialog.name_placeholder": "Name",
  "dialog.save": "Save",
  "dialog.export_json": "Export JSON",
  "dialog.import_json": "Import JSON",
  "dialog.empty": "No saved geometries yet.",
  "dialog.cells": "cells",
  "dialog.load": "Load",
  "dialog.delete": "Delete",
  "dialog.close_aria": "Close",
  "dialog.error_name": "Please enter a name to save.",
  "dialog.error_json": "Invalid JSON file.",
  "dialog.error_read": "Could not read the file.",

  "github.aria": "GitHub repository",

  "theme.label": "Theme:",
};

const translations: Record<Language, Record<TranslationKey, string>> = {
  es: ES,
  en: EN,
};

function detectBrowserLanguage(): Language {
  if (typeof navigator === "undefined") return "es";
  return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
}

function readLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "es") return stored;
  return detectBrowserLanguage();
}

function writeLanguage(lang: Language) {
  localStorage.setItem(STORAGE_KEY, lang);
  window.dispatchEvent(new Event(STORE_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(STORE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(STORE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

interface LanguageContextValue {
  language: Language;
  toggle: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // useSyncExternalStore handles the SSR/hydration split: the server snapshot
  // ("es") matches the static export HTML, and on the client React reads the
  // real value from localStorage/navigator synchronously during hydration —
  // before paint — with no hydration warning.
  const language = useSyncExternalStore<Language>(
    subscribe,
    readLanguage,
    () => "es",
  );

  useEffect(() => {
    document.documentElement.lang = language;
    // The lang init script in layout.tsx hides the body for non-Spanish
    // users to avoid a flash from the statically baked Spanish HTML. React
    // has now committed translations in the correct language — reveal it.
    document.documentElement.removeAttribute("data-lang-pending");
  }, [language]);

  const toggle = useCallback(() => {
    writeLanguage(readLanguage() === "es" ? "en" : "es");
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => translations[language][key],
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
