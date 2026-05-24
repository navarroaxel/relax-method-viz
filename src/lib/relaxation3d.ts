import { applyBoundary3D } from "@/lib/grid3d";
import type { Grid3DState, Solver3DConfig } from "@/types/grid3d";

export const DEFAULT_SOLVER_CONFIG_3D: Solver3DConfig = {
  // 2 / (1 + sin(π/N)) for N = 60 ≈ 1.9. The chebyshev-optimal ω for the
  // Jacobi iteration of the 3D Laplace has the same form as 2D on this grid.
  omega: 1.9,
  tolerance: 1e-3,
  maxIterations: 2000,
  reportEvery: 2,
};

// 3D SOR step on the 6-neighbor Laplace stencil:
//   V'[i,j,k] = (1−ω) V + (ω / 6) (V[i±1] + V[j±1] + V[k±1])
// Returns the maximum absolute update across all free cells.
export function relaxStep3D(grid: Grid3DState, omega: number): number {
  applyBoundary3D(grid);
  const { V, fixed, N } = grid;
  const N2 = N * N;
  let deltaMax = 0;
  for (let i = 1; i < N - 1; i++) {
    const iStride = i * N2;
    for (let j = 1; j < N - 1; j++) {
      const jStride = iStride + j * N;
      for (let k = 1; k < N - 1; k++) {
        const idx = jStride + k;
        if (fixed[idx] === 1) continue;
        const vIp = V[idx + N2] as number;
        const vIm = V[idx - N2] as number;
        const vJp = V[idx + N] as number;
        const vJm = V[idx - N] as number;
        const vKp = V[idx + 1] as number;
        const vKm = V[idx - 1] as number;
        const old = V[idx] as number;
        const avg = (vIp + vIm + vJp + vJm + vKp + vKm) / 6;
        const next = old + omega * (avg - old);
        const delta = next - old;
        const absDelta = delta < 0 ? -delta : delta;
        if (absDelta > deltaMax) deltaMax = absDelta;
        V[idx] = next;
      }
    }
  }
  return deltaMax;
}
