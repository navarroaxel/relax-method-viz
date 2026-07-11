import { describe, it, expect } from "vitest";
import { computeFieldStats } from "@/lib/rendering";
import { idx } from "@/lib/grid";

describe("computeFieldStats", () => {
  it("computes max |V| and max interior |E|", () => {
    const N = 10;
    const V = new Float32Array(N * N);
    // Linear field V = 2*i + 3*j so E = (-2,-3) everywhere interior, mag = sqrt(13).
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        V[idx(i, j, N)] = 2 * i + 3 * j;
      }
    }
    const { vmax, emax } = computeFieldStats(V, N);
    expect(vmax).toBeCloseTo(2 * (N - 1) + 3 * (N - 1), 4);
    expect(emax).toBeCloseTo(Math.hypot(2, 3), 4);
  });

  it("floors both vmax and emax to 1 when V is all zeros", () => {
    const N = 8;
    const V = new Float32Array(N * N);
    const { vmax, emax } = computeFieldStats(V, N);
    expect(vmax).toBe(1);
    expect(emax).toBe(1);
  });
});
