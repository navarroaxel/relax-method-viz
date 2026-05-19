import { applyFixedValues, clearAll, idx } from "@/lib/grid";
import type { GridState, SavedGeometry } from "@/types";

const STORAGE_KEY = "campo-electrico:v1";

interface StorageRoot {
  version: 1;
  geometries: SavedGeometry[];
}

function readRoot(): StorageRoot {
  if (typeof window === "undefined") return { version: 1, geometries: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, geometries: [] };
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      (parsed as { version?: unknown }).version === 1 &&
      Array.isArray((parsed as { geometries?: unknown }).geometries)
    ) {
      return parsed as StorageRoot;
    }
  } catch {
    // fall through to empty default
  }
  return { version: 1, geometries: [] };
}

function writeRoot(root: StorageRoot): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
}

function gridToCells(grid: GridState): Array<[number, number, number]> {
  const { N, fixed, Vfix } = grid;
  const cells: Array<[number, number, number]> = [];
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const k = idx(i, j, N);
      if (fixed[k] === 1) {
        cells.push([i, j, Vfix[k] as number]);
      }
    }
  }
  return cells;
}

const MAX_GRID_N = 512;
const MAX_ABS_V = 1000;

function isSavedGeometry(value: unknown): value is SavedGeometry {
  if (value === null || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.name !== "string" || v.name.length === 0 || v.name.length > 200) return false;
  if (typeof v.N !== "number" || !Number.isInteger(v.N) || v.N < 1 || v.N > MAX_GRID_N) return false;
  const N = v.N;
  if (typeof v.createdAt !== "number" || !Number.isFinite(v.createdAt) || v.createdAt < 0) return false;
  if (!Array.isArray(v.cells) || v.cells.length > N * N) return false;
  for (const cell of v.cells) {
    if (!Array.isArray(cell) || cell.length !== 3) return false;
    if (typeof cell[0] !== "number" || !Number.isInteger(cell[0]) || cell[0] < 0 || cell[0] >= N) return false;
    if (typeof cell[1] !== "number" || !Number.isInteger(cell[1]) || cell[1] < 0 || cell[1] >= N) return false;
    if (typeof cell[2] !== "number" || !Number.isFinite(cell[2]) || Math.abs(cell[2]) > MAX_ABS_V) return false;
  }
  return true;
}

export function listGeometries(): SavedGeometry[] {
  return readRoot().geometries.slice().sort((a, b) => b.createdAt - a.createdAt);
}

export function saveGeometry(name: string, grid: GridState): SavedGeometry {
  const root = readRoot();
  const geometry: SavedGeometry = {
    name,
    N: grid.N,
    cells: gridToCells(grid),
    createdAt: Date.now(),
  };
  const existing = root.geometries.findIndex((g) => g.name === name);
  if (existing >= 0) {
    root.geometries[existing] = geometry;
  } else {
    root.geometries.push(geometry);
  }
  writeRoot(root);
  return geometry;
}

export function loadGeometry(name: string): SavedGeometry | null {
  return readRoot().geometries.find((g) => g.name === name) ?? null;
}

export function deleteGeometry(name: string): void {
  const root = readRoot();
  root.geometries = root.geometries.filter((g) => g.name !== name);
  writeRoot(root);
}

export function exportToJSON(grid: GridState, name = "geometria"): string {
  const geometry: SavedGeometry = {
    name,
    N: grid.N,
    cells: gridToCells(grid),
    createdAt: Date.now(),
  };
  return JSON.stringify(geometry, null, 2);
}

export function importFromJSON(json: string): SavedGeometry | null {
  try {
    const parsed = JSON.parse(json) as unknown;
    return isSavedGeometry(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function applyGeometryToGrid(
  grid: GridState,
  geometry: SavedGeometry,
): void {
  clearAll(grid);
  const { N, fixed, Vfix } = grid;
  for (const [i, j, V] of geometry.cells) {
    if (i < 0 || i >= N || j < 0 || j >= N) continue;
    const k = idx(i, j, N);
    fixed[k] = 1;
    Vfix[k] = V;
  }
  applyFixedValues(grid);
}
