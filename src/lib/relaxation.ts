import { applyBoundary } from "@/lib/grid";
import type { GridState, SolverConfig } from "@/types";

export const DEFAULT_SOLVER_CONFIG: SolverConfig = {
  omega: 1.9,
  tolerance: 1e-3,
  maxIterations: 2000,
  reportEvery: 5,
};

// Numeric solution of Laplace's equation (∇²V = 0) via SOR (Successive Over-Relaxation)
export function relaxStep(grid: GridState, omega: number): number {
  applyBoundary(grid);
  const V = grid.V;
  const fixed = grid.fixed;
  const N = grid.N;
  let deltaMax = 0;
  for (let i = 1; i < N - 1; i++) {
    const rowStart = i * N;
    for (let j = 1; j < N - 1; j++) {
      const k = rowStart + j;
      if (fixed[k] === 1) {
        continue;
      }
      const vRight = V[k + N] as number;
      const vLeft = V[k - N] as number;
      const vDown = V[k + 1] as number;
      const vUp = V[k - 1] as number;
      const old = V[k] as number;
      const avg = (vRight + vLeft + vDown + vUp) * 0.25;
      // SOR update: omega>1 overshoots toward avg, accelerating convergence
      const next = old + omega * (avg - old);
      const delta = next - old;
      const absDelta = delta < 0 ? -delta : delta;
      if (absDelta > deltaMax) {
        deltaMax = absDelta;
      }
      V[k] = next;
    }
  }
  return deltaMax;
}
