import type { BoundaryCondition, GridState, Tool } from "@/types";

// Indexing convention: idx(i, j, N) = i * N + j.
// `i` is the column (x axis, increases to the right on screen).
// `j` is the row    (y axis, increases downward on screen).
// Marching squares and finite differences rely on this convention.
export function idx(i: number, j: number, N: number): number {
  return i * N + j;
}

export function createGrid(
  N: number,
  boundary: BoundaryCondition = "dirichlet0",
): GridState {
  const size = N * N;
  return {
    N,
    V: new Float32Array(size),
    fixed: new Uint8Array(size),
    Vfix: new Float32Array(size),
    boundary,
  };
}

export function applyFixedValues(grid: GridState): void {
  const { V, Vfix, fixed } = grid;
  for (let k = 0; k < V.length; k++) {
    if (fixed[k] === 1) V[k] = Vfix[k] as number;
  }
}

export function applyBoundary(grid: GridState): void {
  const { V, N, boundary } = grid;
  // Dirichlet boundary condition (V = 0)
  if (boundary === "dirichlet0") {
    for (let i = 0; i < N; i++) {
      V[idx(i, 0, N)] = 0;
      V[idx(i, N - 1, N)] = 0;
      V[idx(0, i, N)] = 0;
      V[idx(N - 1, i, N)] = 0;
    }
  } else {
    // Neumann boundary condition (∂V/∂n = 0)
    for (let i = 1; i < N - 1; i++) {
      V[idx(i, 0, N)] = V[idx(i, 1, N)] as number;
      V[idx(i, N - 1, N)] = V[idx(i, N - 2, N)] as number;
      V[idx(0, i, N)] = V[idx(1, i, N)] as number;
      V[idx(N - 1, i, N)] = V[idx(N - 2, i, N)] as number;
    }
    V[idx(0, 0, N)] = V[idx(1, 1, N)] as number;
    V[idx(N - 1, 0, N)] = V[idx(N - 2, 1, N)] as number;
    V[idx(0, N - 1, N)] = V[idx(1, N - 2, N)] as number;
    V[idx(N - 1, N - 1, N)] = V[idx(N - 2, N - 2, N)] as number;
  }
}

export function paintCell(
  grid: GridState,
  i: number,
  j: number,
  tool: Tool,
  voltage: number,
): void {
  const { N, fixed, Vfix, V } = grid;
  if (i < 0 || i >= N || j < 0 || j >= N) return;
  const k = idx(i, j, N);
  switch (tool) {
    case "pos":
      fixed[k] = 1;
      Vfix[k] = voltage;
      V[k] = voltage;
      break;
    case "neg":
      fixed[k] = 1;
      Vfix[k] = -voltage;
      V[k] = -voltage;
      break;
    case "gnd":
      fixed[k] = 1;
      Vfix[k] = 0;
      V[k] = 0;
      break;
    case "era":
      fixed[k] = 0;
      Vfix[k] = 0;
      V[k] = 0;
      break;
  }
}

export function paintBrush(
  grid: GridState,
  ci: number,
  cj: number,
  radius: number,
  tool: Tool,
  voltage: number,
): void {
  const r = Math.max(0, Math.floor(radius) - 1);
  for (let di = -r; di <= r; di++) {
    for (let dj = -r; dj <= r; dj++) {
      paintCell(grid, ci + di, cj + dj, tool, voltage);
    }
  }
}

// Bresenham-like rasterization between two brush centers so fast drags
// do not leave gaps in the painted strip.
export function paintStroke(
  grid: GridState,
  i0: number,
  j0: number,
  i1: number,
  j1: number,
  radius: number,
  tool: Tool,
  voltage: number,
): void {
  const di = Math.abs(i1 - i0);
  const dj = Math.abs(j1 - j0);
  const si = i0 < i1 ? 1 : -1;
  const sj = j0 < j1 ? 1 : -1;
  let err = di - dj;
  let i = i0;
  let j = j0;
  while (true) {
    paintBrush(grid, i, j, radius, tool, voltage);
    if (i === i1 && j === j1) break;
    const e2 = 2 * err;
    if (e2 > -dj) {
      err -= dj;
      i += si;
    }
    if (e2 < di) {
      err += di;
      j += sj;
    }
  }
}

export function resetPotential(grid: GridState): void {
  grid.V.fill(0);
  applyFixedValues(grid);
}

export function clearAll(grid: GridState): void {
  grid.V.fill(0);
  grid.fixed.fill(0);
  grid.Vfix.fill(0);
}
