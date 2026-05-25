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
    "Elegí Traza recta (dos clics, o el mismo clic dos veces para una sonda) o Curva libre (arrastrar) y dibujá sobre el lienzo.",
  "trace.axis_v": "V",
  "trace.axis_e": "|E|",
  "trace.axis_s": "s (celdas)",

  "stripchart.ac.title": "Ondas AC — sin(ωt + φ)",
  "stripchart.ac.sin_label": "sin(ωt)",
  "stripchart.ac.phase_prefix": "φ",
  "stripchart.probe.title": "Sonda V(t), |E|(t)",
  "stripchart.axis_t": "t (s)",
  "stripchart.probe.empty_hint":
    "Esperando muestras… ejecutá la simulación para registrar V y |E| en el punto sondeado.",

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

  "preset.custom": "— Personalizado —",
  "preset.parallel": "Capacitor plano",
  "preset.dipole": "Dipolo",
  "preset.lightning": "Pararrayos simplificado",
  "preset.coaxial": "Cable Coaxial",
  "preset.faraday": "Jaula de Faraday",
  "preset.tip": "Punta vs plano",
  "preset.conductors": "Placas conductoras",
  "preset.subconductors": "Línea 4 subconductores",
  "preset.threephase": "Línea trifásica + neutro",

  "export.save_load": "Guardar / Cargar",
  "export.png": "Exportar PNG",

  "legend.title": "Referencia",
  "legend.ground": "Tierra",

  "stats.iteration": "Iteración:",
  "stats.tolerance": "tolerancia",

  "explanation.relax.part1":
    "El método de relajación resuelve ∇²V = 0 discretizando el plano en una grilla cuadrada y reemplazando iterativamente cada nodo no fijo por el promedio de sus cuatro vecinos. Con sobre-relajación sucesiva (SOR), cada nodo se actualiza como",
  "explanation.relax.average": "promedio",
  "explanation.relax.part2":
    ", con ω ≈ 1.9 para esta grilla. El campo se obtiene después por",
  "explanation.relax.part3": "con diferencias centradas.",
  "explanation.trace":
    "La herramienta de traza muestrea el potencial V(s) y la magnitud del campo |E| a lo largo de un segmento o curva libre. V se obtiene por interpolación bilineal entre celdas; |E| por diferencias centradas de −∇V. Si la traza tiene un solo punto se convierte en una sonda y registra V(t) y |E|(t) en función del tiempo.",
  "explanation.ac":
    "Con modulación AC, cada conductor fijo oscila como V = Vfix · sin(ωt + φ), con ω = 2π/T (T es el período en segundos) y φ una fase por celda configurable al pintar. Esto permite simular fuentes desfasadas — por ejemplo un dipolo con φ = 180° en uno de los polos. Mientras AC está activa, el campo nunca llega a régimen estacionario y el solver no se detiene por convergencia.",

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

  "mode.2d": "2D",
  "mode.3d": "3D",

  "toolbar3d.tool": "Primitiva:",
  "toolbar3d.tool_wire": "Cable",
  "toolbar3d.tool_plate": "Placa",
  "toolbar3d.tool_sphere": "Esfera",
  "toolbar3d.tool_cylinder": "Cilindro",
  "toolbar3d.tool_era": "Borrar",
  "toolbar3d.potential": "Potencial:",
  "toolbar3d.custom_voltage": "personalizado",
  "toolbar3d.thickness": "Grosor:",
  "toolbar3d.radius": "Radio:",
  "toolbar3d.slice_axis": "Eje del corte:",

  "viewport3d.anchor_hint": "1/2 — segundo clic para confirmar",

  "preset3d.label": "Preajuste:",
  "preset3d.parallel": "Placas paralelas (3D)",
  "preset3d.dipole": "Dipolo (3D)",
  "preset3d.coax": "Cable coaxial (3D)",
  "preset3d.lightning": "Pararrayos simplificado (3D)",
  "preset3d.faraday": "Jaula de Faraday (3D)",
  "preset3d.subconductors": "Línea 4 subconductores (3D)",
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
    "Pick Straight trace (two clicks, or click the same spot twice to drop a probe) or Free curve (drag) and draw on the canvas.",
  "trace.axis_v": "V",
  "trace.axis_e": "|E|",
  "trace.axis_s": "s (cells)",

  "stripchart.ac.title": "AC waveforms — sin(ωt + φ)",
  "stripchart.ac.sin_label": "sin(ωt)",
  "stripchart.ac.phase_prefix": "φ",
  "stripchart.probe.title": "Probe V(t), |E|(t)",
  "stripchart.axis_t": "t (s)",
  "stripchart.probe.empty_hint":
    "Waiting for samples… run the simulation to record V and |E| at the probed point.",

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

  "preset.custom": "— Custom —",
  "preset.parallel": "Parallel plate capacitor",
  "preset.dipole": "Dipole",
  "preset.lightning": "Lightning rod (simplified)",
  "preset.coaxial": "Coaxial cable",
  "preset.faraday": "Faraday cage",
  "preset.tip": "Tip vs plane",
  "preset.conductors": "Conducting plates",
  "preset.subconductors": "4-subconductor line",
  "preset.threephase": "Three-phase line + neutral",

  "export.save_load": "Save / Load",
  "export.png": "Export PNG",

  "legend.title": "Legend",
  "legend.ground": "Ground",

  "stats.iteration": "Iteration:",
  "stats.tolerance": "tolerance",

  "explanation.relax.part1":
    "The relaxation method solves ∇²V = 0 by discretizing the plane onto a square grid and iteratively replacing each free node with the average of its four neighbors. With successive over-relaxation (SOR), each node is updated as",
  "explanation.relax.average": "average",
  "explanation.relax.part2":
    ", with ω ≈ 1.9 for this grid. The field is then obtained by",
  "explanation.relax.part3": "using centered differences.",
  "explanation.trace":
    "The trace tool samples the potential V(s) and the field magnitude |E| along a straight segment or freehand curve. V uses bilinear interpolation between cells; |E| comes from centered differences of −∇V. A single-point trace becomes a probe and records V(t) and |E|(t) over time.",
  "explanation.ac":
    "With AC modulation enabled, each fixed conductor oscillates as V = Vfix · sin(ωt + φ), with ω = 2π/T (T is the period in seconds) and φ a per-cell phase set while painting. This lets you simulate phase-shifted sources — e.g. a dipole with φ = 180° on one pole. While AC is on the field never settles, so the solver runs continuously instead of stopping at convergence.",

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

  "mode.2d": "2D",
  "mode.3d": "3D",

  "toolbar3d.tool": "Primitive:",
  "toolbar3d.tool_wire": "Wire",
  "toolbar3d.tool_plate": "Plate",
  "toolbar3d.tool_sphere": "Sphere",
  "toolbar3d.tool_cylinder": "Cylinder",
  "toolbar3d.tool_era": "Erase",
  "toolbar3d.potential": "Potential:",
  "toolbar3d.custom_voltage": "custom",
  "toolbar3d.thickness": "Thickness:",
  "toolbar3d.radius": "Radius:",
  "toolbar3d.slice_axis": "Slice axis:",

  "viewport3d.anchor_hint": "1/2 — second click to confirm",

  "preset3d.label": "Preset:",
  "preset3d.parallel": "Parallel plates (3D)",
  "preset3d.dipole": "Dipole (3D)",
  "preset3d.coax": "Coaxial cable (3D)",
  "preset3d.lightning": "Lightning rod (3D)",
  "preset3d.faraday": "Faraday cage (3D)",
  "preset3d.subconductors": "4-subconductor bundle (3D)",
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
