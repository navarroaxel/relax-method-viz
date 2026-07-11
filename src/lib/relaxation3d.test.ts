import { describe, expect, it } from "vitest";
import { DEFAULT_SOLVER_CONFIG_3D, relaxStep3D } from "@/lib/relaxation3d";
import { createGrid3D, idx3 } from "@/lib/grid3d";
import type { Grid3DState } from "@/types/grid3d";

describe("DEFAULT_SOLVER_CONFIG_3D", () => {
  it("matches the documented defaults", () => {
    expect(DEFAULT_SOLVER_CONFIG_3D).toEqual({
      omega: 1.9,
      tolerance: 1e-3,
      maxIterations: 2000,
      reportEvery: 2,
    });
  });
});

describe("relaxStep3D", () => {
  it("never mutates a fixed cell's value and returns a nonnegative deltaMax", () => {
    const N = 12;
    const grid = createGrid3D(N);
    const c = idx3(6, 6, 6, N);
    grid.fixed[c] = 1;
    grid.Vfix[c] = 33;
    grid.V[c] = 33;

    for (let iter = 0; iter < 50; iter++) {
      const deltaMax = relaxStep3D(grid, 1.9);
      expect(deltaMax).toBeGreaterThanOrEqual(0);
      expect(grid.V[c]).toBe(33);
    }
  });

  it("solves two parallel slabs (perpendicular to j): linear, monotonic profile across the gap", () => {
    const N = 20;
    const grid: Grid3DState = createGrid3D(N);
    const V0 = 100;
    const j0 = 3;
    const j1 = N - 4;
    const probeI = Math.floor(N / 2);
    const probeK = Math.floor(N / 2);

    for (let i = 1; i < N - 1; i++) {
      for (let k = 1; k < N - 1; k++) {
        const cTop = idx3(i, j0, k, N);
        grid.fixed[cTop] = 1;
        grid.Vfix[cTop] = V0;
        grid.V[cTop] = V0;

        const cBot = idx3(i, j1, k, N);
        grid.fixed[cBot] = 1;
        grid.Vfix[cBot] = -V0;
        grid.V[cBot] = -V0;
      }
    }

    const omega = 1.9;
    let deltaMax = Infinity;
    let iters = 0;
    const maxIters = 3000;
    while (deltaMax >= DEFAULT_SOLVER_CONFIG_3D.tolerance && iters < maxIters) {
      deltaMax = relaxStep3D(grid, omega);
      iters++;
    }
    expect(deltaMax).toBeLessThan(1e-1);

    const profile: number[] = [];
    for (let j = j0; j <= j1; j++) {
      profile.push(grid.V[idx3(probeI, j, probeK, N)] as number);
    }

    for (let n = 1; n < profile.length; n++) {
      expect(profile[n]).toBeLessThanOrEqual((profile[n - 1] as number) + 1e-6);
    }

    const gap = j1 - j0;
    for (let n = 0; n < profile.length; n++) {
      const idealV = V0 - (2 * V0 * n) / gap;
      expect(profile[n]).toBeCloseTo(idealV, 0);
    }
  });
});
