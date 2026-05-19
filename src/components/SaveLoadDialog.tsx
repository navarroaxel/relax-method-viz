"use client";

import { useState } from "react";
import {
  deleteGeometry,
  exportToJSON,
  importFromJSON,
  listGeometries,
  saveGeometry,
} from "@/lib/storage";
import type { GridState, SavedGeometry } from "@/types";

interface SaveLoadDialogProps {
  onClose: () => void;
  grid: GridState;
  onLoad: (geometry: SavedGeometry) => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function SaveLoadDialog({
  onClose,
  grid,
  onLoad,
}: SaveLoadDialogProps) {
  const [name, setName] = useState("");
  const [geometries, setGeometries] = useState<SavedGeometry[]>(() =>
    listGeometries(),
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refresh = () => setGeometries(listGeometries());

  const handleSave = () => {
    const n = name.trim();
    if (!n) {
      setErrorMsg("Poné un nombre para guardar.");
      return;
    }
    saveGeometry(n, grid);
    setName("");
    setErrorMsg(null);
    refresh();
  };

  const handleLoad = (g: SavedGeometry) => {
    if (g.N !== grid.N) {
      setErrorMsg(
        `Tamaño de grilla incompatible (guardado: ${g.N}, actual: ${grid.N}).`,
      );
      return;
    }
    onLoad(g);
    onClose();
  };

  const handleDelete = (n: string) => {
    deleteGeometry(n);
    refresh();
  };

  const handleExportJSON = () => {
    const fname = (name.trim() || "geometria").replace(/[^a-zA-Z0-9_-]+/g, "_");
    downloadFile(
      exportToJSON(grid, name.trim() || "geometria"),
      `${fname}.json`,
      "application/json",
    );
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const geom = importFromJSON(text);
      if (!geom) {
        setErrorMsg("Archivo JSON inválido.");
        return;
      }
      if (geom.N !== grid.N) {
        setErrorMsg(
          `Tamaño de grilla incompatible (archivo: ${geom.N}, actual: ${grid.N}).`,
        );
        return;
      }
      onLoad(geom);
      onClose();
    } catch {
      setErrorMsg("No se pudo leer el archivo.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-lg border border-zinc-300 bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Guardar / Cargar geometría
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre"
            className="flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={handleExportJSON}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            Exportar JSON
          </button>
          <label className="cursor-pointer rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700">
            Importar JSON
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) handleImportFile(file);
              }}
            />
          </label>
        </div>

        {errorMsg && (
          <p className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {errorMsg}
          </p>
        )}

        <div className="max-h-80 overflow-y-auto rounded-md border border-zinc-200 dark:border-zinc-700">
          {geometries.length === 0 ? (
            <p className="p-3 text-sm text-zinc-500 dark:text-zinc-400">
              No hay geometrías guardadas todavía.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {geometries.map((g) => (
                <li
                  key={g.name}
                  className="flex flex-wrap items-center justify-between gap-2 p-2 text-sm"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{g.name}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDate(g.createdAt)} · {g.cells.length} celdas · N=
                      {g.N}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleLoad(g)}
                      className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                    >
                      Cargar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(g.name)}
                      className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:bg-zinc-800 dark:text-red-300 dark:hover:bg-red-950/40"
                    >
                      Borrar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
