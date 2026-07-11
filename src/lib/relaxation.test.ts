import { describe, expect, it } from "vitest";
import { DEFAULT_SOLVER_CONFIG, relaxStep } from "@/lib/relaxation";
import { createGrid, idx } from "@/lib/grid";
import type { GridState } from "@/types";

describe("DEFAULT_SOLVER_CONFIG", () => {
  it("matches the documented defaults", () => {
    expect(DEFAULT_SOLVER_CONFIG).toEqual({
      omega: 1.9,
      tolerance: 1e-3,
      maxIterations: 2000,
      reportEvery: 5,
    });
  });
});

describe("relaxStep", () => {
  it("never mutates a fixed cell's value and returns a nonnegative deltaMax", () => {
    const N = 20;
    const grid = createGrid(N);
    const fi = 10;
    const fj = 10;
    const k = idx(fi, fj, N);
    grid.fixed[k] = 1;
    grid.Vfix[k] = 42;
    grid.V[k] = 42;

    for (let iter = 0; iter < 100; iter++) {
      const deltaMax = relaxStep(grid, 1.9);
      expect(deltaMax).toBeGreaterThanOrEqual(0);
      expect(grid.V[k]).toBe(42);
    }
  });

  it("solves a parallel-plate capacitor: linear, monotonic, symmetric profile between plates", () => {
    const N = 40;
    const grid: GridState = createGrid(N);
    const V0 = 100;
    const j0 = 6; // top plate row (interior, off boundary)
    const j1 = N - 6; // bottom plate row (interior, off boundary); gap is even
    // so the midpoint below lands exactly on a grid row.
    const probeCol = Math.floor(N / 2);

    // Full-width plates across all interior columns.
    for (let i = 1; i < N - 1; i++) {
      grid.fixed[idx(i, j0, N)] = 1;
      grid.Vfix[idx(i, j0, N)] = V0;
      grid.V[idx(i, j0, N)] = V0;

      grid.fixed[idx(i, j1, N)] = 1;
      grid.Vfix[idx(i, j1, N)] = -V0;
      grid.V[idx(i, j1, N)] = -V0;
    }

    const omega = 1.9;
    let deltaMax = Infinity;
    const maxIters = 5000;
    let iters = 0;
    while (deltaMax >= DEFAULT_SOLVER_CONFIG.tolerance && iters < maxIters) {
      deltaMax = relaxStep(grid, omega);
      iters++;
    }
    expect(deltaMax).toBeLessThan(1e-2);

    // Sample V along the vertical line at probeCol between the plates.
    const profile: number[] = [];
    for (let j = j0; j <= j1; j++) {
      profile.push(grid.V[idx(probeCol, j, N)] as number);
    }

    // Monotonic decreasing from +V0 to -V0.
    for (let n = 1; n < profile.length; n++) {
      expect(profile[n]).toBeLessThanOrEqual((profile[n - 1] as number) + 1e-6);
    }

    // Approximately linear: compare against the ideal linear interpolation.
    const gap = j1 - j0;
    for (let n = 0; n < profile.length; n++) {
      const idealV = V0 - (2 * V0 * n) / gap;
      expect(profile[n]).toBeCloseTo(idealV, 0);
    }

    // Midplane symmetry: V ≈ 0 halfway between the plates.
    const midJ = Math.round((j0 + j1) / 2);
    const midV = grid.V[idx(probeCol, midJ, N)] as number;
    expect(midV).toBeCloseTo(0, 0);
  });
});
