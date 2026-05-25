import type { Grid3DState } from "@/types/grid3d";

// idx3(i, j, k, N) = (i * N + j) * N + k — k varies fastest.
export function idx3(i: number, j: number, k: number, N: number): number {
  return (i * N + j) * N + k;
}

export function createGrid3D(N: number): Grid3DState {
  const size = N * N * N;
  return {
    N,
    V: new Float32Array(size),
    fixed: new Uint8Array(size),
    Vfix: new Float32Array(size),
  };
}

export function applyFixedValues3D(grid: Grid3DState): void {
  const { V, Vfix, fixed } = grid;
  for (let k = 0; k < V.length; k++) {
    if (fixed[k] === 1) V[k] = Vfix[k] as number;
  }
}

// Neumann boundary (∂V/∂n = 0): copy each face from its inward neighbor.
// Edges and corners pull diagonally, matching the 2D convention.
export function applyBoundary3D(grid: Grid3DState): void {
  const { V, N } = grid;
  const last = N - 1;
  // Faces (i = 0 and i = last)
  for (let j = 0; j < N; j++) {
    for (let k = 0; k < N; k++) {
      V[idx3(0, j, k, N)] = V[idx3(1, j, k, N)] as number;
      V[idx3(last, j, k, N)] = V[idx3(last - 1, j, k, N)] as number;
    }
  }
  // Faces (j = 0 and j = last)
  for (let i = 0; i < N; i++) {
    for (let k = 0; k < N; k++) {
      V[idx3(i, 0, k, N)] = V[idx3(i, 1, k, N)] as number;
      V[idx3(i, last, k, N)] = V[idx3(i, last - 1, k, N)] as number;
    }
  }
  // Faces (k = 0 and k = last)
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      V[idx3(i, j, 0, N)] = V[idx3(i, j, 1, N)] as number;
      V[idx3(i, j, last, N)] = V[idx3(i, j, last - 1, N)] as number;
    }
  }
}

export function resetPotential3D(grid: Grid3DState): void {
  grid.V.fill(0);
  applyFixedValues3D(grid);
}

export function clearAll3D(grid: Grid3DState): void {
  grid.V.fill(0);
  grid.fixed.fill(0);
  grid.Vfix.fill(0);
}
