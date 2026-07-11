import { describe, it, expect } from "vitest";
import { sampleV, sampleE, sampleEForStreamline, sampleTrace } from "@/lib/sampling";
import { createGrid, idx } from "@/lib/grid";
import type { GridState } from "@/types";

function linearGrid(N: number, a: number, b: number): GridState {
  const g = createGrid(N);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      g.V[idx(i, j, N)] = a * i + b * j;
    }
  }
  return g;
}

describe("sampleV", () => {
  const N = 20;
  const a = 2.5;
  const b = -1.3;
  const g = linearGrid(N, a, b);

  it("is exact for a linear field at fractional coords (bilinear is exact for linear fields)", () => {
    expect(sampleV(g.V, N, 5.3, 8.7)).toBeCloseTo(a * 5.3 + b * 8.7, 5);
    expect(sampleV(g.V, N, 0, 0)).toBeCloseTo(0, 5);
    expect(sampleV(g.V, N, 10, 10)).toBeCloseTo(a * 10 + b * 10, 5);
  });

  it("clamps out-of-range coordinates to the border", () => {
    // Beyond the border, clamp(i) always yields N-1 so the result equals the
    // corner value (a*(N-1) + b*(N-1)).
    const expected = a * (N - 1) + b * (N - 1);
    expect(sampleV(g.V, N, 1000, 1000)).toBeCloseTo(expected, 5);
    expect(sampleV(g.V, N, -1000, -1000)).toBeCloseTo(0, 5);
  });
});

describe("sampleE", () => {
  const N = 20;
  const a = 2.5;
  const b = -1.3;
  const g = linearGrid(N, a, b);

  it("returns constant (ex,ey) = (-a,-b) on the linear field interior", () => {
    const r1 = sampleE(g.V, N, 5.3, 8.7);
    expect(r1.ex).toBeCloseTo(-a, 5);
    expect(r1.ey).toBeCloseTo(-b, 5);
    expect(r1.mag).toBeCloseTo(Math.hypot(a, b), 5);

    const r2 = sampleE(g.V, N, 10, 10);
    expect(r2.ex).toBeCloseTo(-a, 5);
    expect(r2.ey).toBeCloseTo(-b, 5);
  });
});

describe("sampleEForStreamline", () => {
  const N = 20;
  const a = 1;
  const b = 1;

  it("returns mag=0 near the border", () => {
    const g = linearGrid(N, a, b);
    expect(sampleEForStreamline(g.V, g.fixed, N, 0.5, 5).mag).toBe(0); // i0 < 1
    expect(sampleEForStreamline(g.V, g.fixed, N, 5, 0.5).mag).toBe(0); // j0 < 1
    expect(sampleEForStreamline(g.V, g.fixed, N, N - 1.5, 5).mag).toBe(0); // i0 >= N-2
    expect(sampleEForStreamline(g.V, g.fixed, N, 5, N - 1.5).mag).toBe(0); // j0 >= N-2
  });

  it("returns mag=0 when an enclosing cell is fixed", () => {
    const g = linearGrid(N, a, b);
    // Interior point away from border, sanity check it's nonzero first.
    const before = sampleEForStreamline(g.V, g.fixed, N, 5.3, 5.3);
    expect(before.mag).toBeGreaterThan(0);
    // Mark one of the 4 enclosing cells (5,5) fixed.
    g.fixed[idx(5, 5, N)] = 1;
    const after = sampleEForStreamline(g.V, g.fixed, N, 5.3, 5.3);
    expect(after.mag).toBe(0);
  });
});

describe("sampleTrace", () => {
  const N = 20;
  const a = 2;
  const b = -1;
  const g = linearGrid(N, a, b);

  it("returns null for fewer than 2 points", () => {
    expect(sampleTrace(g, [[1, 1]], 0.5)).toBeNull();
    expect(sampleTrace(g, [], 0.5)).toBeNull();
  });

  it("returns null for ds <= 0", () => {
    expect(
      sampleTrace(
        g,
        [
          [1, 1],
          [5, 5],
        ],
        0,
      ),
    ).toBeNull();
    expect(
      sampleTrace(
        g,
        [
          [1, 1],
          [5, 5],
        ],
        -1,
      ),
    ).toBeNull();
  });

  it("returns null for a zero-length path", () => {
    expect(
      sampleTrace(
        g,
        [
          [3, 3],
          [3, 3],
        ],
        0.5,
      ),
    ).toBeNull();
  });

  it("samples a uniform arc-length straight line matching the linear field", () => {
    const p0: [number, number] = [2, 2];
    const p1: [number, number] = [12, 2];
    const ds = 0.5;
    const result = sampleTrace(g, [p0, p1], ds);
    expect(result).not.toBeNull();
    const { s, V, E, sMax } = result!;
    expect(sMax).toBeCloseTo(10, 5);
    expect(s[s.length - 1]).toBeCloseTo(sMax, 4);
    // Uniform spacing between s values.
    const step = (s[1] as number) - (s[0] as number);
    for (let k = 1; k < s.length; k++) {
      expect((s[k] as number) - (s[k - 1] as number)).toBeCloseTo(step, 5);
    }
    // V and E should match the linear field along the line y=2.
    for (let k = 0; k < s.length; k++) {
      const x = p0[0] + (s[k] as number); // moving along x since p0->p1 is horizontal
      expect(V[k]).toBeCloseTo(a * x + b * 2, 3);
      expect(E[k]).toBeCloseTo(Math.hypot(a, b), 3);
    }
  });
});
