import { describe, it, expect } from "vitest";
import {
  idx,
  createGrid,
  paintCell,
  paintBrush,
  paintStroke,
  applyFixedValues,
  applyBoundary,
  clearAll,
  applyModulatedFixed,
} from "@/lib/grid";

describe("idx", () => {
  it("is column-major: i*N+j", () => {
    expect(idx(0, 0, 10)).toBe(0);
    expect(idx(1, 0, 10)).toBe(10);
    expect(idx(0, 1, 10)).toBe(1);
    expect(idx(2, 3, 10)).toBe(23);
  });
});

describe("createGrid", () => {
  it("allocates arrays of length N*N and defaults to neumann", () => {
    const N = 8;
    const g = createGrid(N);
    expect(g.N).toBe(N);
    expect(g.V.length).toBe(N * N);
    expect(g.fixed.length).toBe(N * N);
    expect(g.Vfix.length).toBe(N * N);
    expect(g.phase.length).toBe(N * N);
    expect(g.boundary).toBe("neumann");
  });

  it("honors an explicit boundary condition", () => {
    const g = createGrid(4, "dirichlet");
    expect(g.boundary).toBe("dirichlet");
  });
});

describe("paintCell", () => {
  const N = 10;

  it("pos: sets fixed, Vfix, V, phase", () => {
    const g = createGrid(N);
    paintCell(g, 3, 4, "pos", 100, 1.5);
    const k = idx(3, 4, N);
    expect(g.fixed[k]).toBe(1);
    expect(g.Vfix[k]).toBe(100);
    expect(g.V[k]).toBe(100);
    expect(g.phase[k]).toBe(1.5);
  });

  it("neg: negates the voltage", () => {
    const g = createGrid(N);
    paintCell(g, 3, 4, "neg", 100, 0.7);
    const k = idx(3, 4, N);
    expect(g.fixed[k]).toBe(1);
    expect(g.Vfix[k]).toBe(-100);
    expect(g.V[k]).toBe(-100);
    expect(g.phase[k]).toBeCloseTo(0.7, 5);
  });

  it("gnd: forces 0 regardless of voltage/phase args", () => {
    const g = createGrid(N);
    paintCell(g, 3, 4, "gnd", 100, 1.5);
    const k = idx(3, 4, N);
    expect(g.fixed[k]).toBe(1);
    expect(g.Vfix[k]).toBe(0);
    expect(g.V[k]).toBe(0);
    expect(g.phase[k]).toBe(0);
  });

  it("era: clears fixed and all values", () => {
    const g = createGrid(N);
    paintCell(g, 3, 4, "pos", 100, 1.5);
    paintCell(g, 3, 4, "era", 999, 999);
    const k = idx(3, 4, N);
    expect(g.fixed[k]).toBe(0);
    expect(g.Vfix[k]).toBe(0);
    expect(g.V[k]).toBe(0);
    expect(g.phase[k]).toBe(0);
  });

  it("is a no-op for out-of-range coordinates", () => {
    const g = createGrid(N);
    const before = g.V.slice();
    paintCell(g, -1, 0, "pos", 100);
    paintCell(g, 0, -1, "pos", 100);
    paintCell(g, N, 0, "pos", 100);
    paintCell(g, 0, N, "pos", 100);
    expect(g.V).toEqual(before);
    expect(g.fixed.every((f) => f === 0)).toBe(true);
  });
});

describe("paintBrush", () => {
  const N = 20;

  it("radius 1 paints exactly a single cell", () => {
    const g = createGrid(N);
    paintBrush(g, 10, 10, 1, "pos", 50);
    const count = g.fixed.reduce((a, b) => a + b, 0);
    expect(count).toBe(1);
    expect(g.fixed[idx(10, 10, N)]).toBe(1);
  });

  it("radius 0 also paints a single cell (clamped to half-size 0)", () => {
    const g = createGrid(N);
    paintBrush(g, 10, 10, 0, "pos", 50);
    const count = g.fixed.reduce((a, b) => a + b, 0);
    expect(count).toBe(1);
  });

  it("radius 3 paints a 5x5 block (half-size = floor(3)-1 = 2)", () => {
    const g = createGrid(N);
    paintBrush(g, 10, 10, 3, "pos", 50);
    const count = g.fixed.reduce((a, b) => a + b, 0);
    expect(count).toBe(5 * 5); // half-size 2 -> (2*2+1)^2 = 25
    for (let di = -2; di <= 2; di++) {
      for (let dj = -2; dj <= 2; dj++) {
        expect(g.fixed[idx(10 + di, 10 + dj, N)]).toBe(1);
      }
    }
  });

  it("radius 2 paints a 3x3 block (half-size = floor(2)-1 = 1)", () => {
    const g = createGrid(N);
    paintBrush(g, 10, 10, 2, "pos", 50);
    const count = g.fixed.reduce((a, b) => a + b, 0);
    // half-size = max(0, floor(2)-1) = 1 -> 3x3 = 9
    expect(count).toBe(3 * 3);
  });
});

describe("paintStroke", () => {
  const N = 30;

  it("leaves no gaps along a diagonal line at radius 1", () => {
    const g = createGrid(N);
    paintStroke(g, 2, 2, 10, 10, 1, "pos", 50);
    // Every integer cell on the diagonal from (2,2) to (10,10) should be painted.
    for (let t = 2; t <= 10; t++) {
      expect(g.fixed[idx(t, t, N)]).toBe(1);
    }
  });

  it("leaves no gaps along a shallow (non-45-degree) line", () => {
    const g = createGrid(N);
    paintStroke(g, 0, 0, 10, 3, 1, "pos", 50);
    // Bresenham guarantees connectivity: check every column 0..10 has at least one painted cell.
    for (let i = 0; i <= 10; i++) {
      let any = false;
      for (let j = 0; j < N; j++) {
        if (g.fixed[idx(i, j, N)] === 1) any = true;
      }
      expect(any).toBe(true);
    }
  });
});

describe("applyFixedValues", () => {
  it("copies Vfix to V only where fixed===1", () => {
    const N = 5;
    const g = createGrid(N);
    g.fixed[idx(1, 1, N)] = 1;
    g.Vfix[idx(1, 1, N)] = 42;
    g.V[idx(1, 1, N)] = 0;
    g.Vfix[idx(2, 2, N)] = 99; // not fixed
    applyFixedValues(g);
    expect(g.V[idx(1, 1, N)]).toBe(42);
    expect(g.V[idx(2, 2, N)]).toBe(0);
  });
});

describe("applyBoundary", () => {
  it("neumann mirrors inward neighbors on edges and pulls diagonally at corners", () => {
    const N = 6;
    const g = createGrid(N, "neumann");
    // Set an interior pattern.
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        g.V[idx(i, j, N)] = i * 10 + j;
      }
    }
    applyBoundary(g);
    for (let i = 1; i < N - 1; i++) {
      expect(g.V[idx(i, 0, N)]).toBe(g.V[idx(i, 1, N)]);
      expect(g.V[idx(i, N - 1, N)]).toBe(g.V[idx(i, N - 2, N)]);
      expect(g.V[idx(0, i, N)]).toBe(g.V[idx(1, i, N)]);
      expect(g.V[idx(N - 1, i, N)]).toBe(g.V[idx(N - 2, i, N)]);
    }
    expect(g.V[idx(0, 0, N)]).toBe(g.V[idx(1, 1, N)]);
    expect(g.V[idx(N - 1, 0, N)]).toBe(g.V[idx(N - 2, 1, N)]);
    expect(g.V[idx(0, N - 1, N)]).toBe(g.V[idx(1, N - 2, N)]);
    expect(g.V[idx(N - 1, N - 1, N)]).toBe(g.V[idx(N - 2, N - 2, N)]);
  });

  it("dirichlet zeroes all four edges", () => {
    const N = 6;
    const g = createGrid(N, "dirichlet");
    g.V.fill(5);
    applyBoundary(g);
    for (let i = 0; i < N; i++) {
      expect(g.V[idx(i, 0, N)]).toBe(0);
      expect(g.V[idx(i, N - 1, N)]).toBe(0);
      expect(g.V[idx(0, i, N)]).toBe(0);
      expect(g.V[idx(N - 1, i, N)]).toBe(0);
    }
    // interior untouched
    expect(g.V[idx(2, 2, N)]).toBe(5);
  });
});

describe("clearAll", () => {
  it("zeroes V, fixed, Vfix, phase", () => {
    const N = 5;
    const g = createGrid(N);
    paintCell(g, 1, 1, "pos", 100, 2);
    clearAll(g);
    expect(g.V.every((v) => v === 0)).toBe(true);
    expect(g.fixed.every((v) => v === 0)).toBe(true);
    expect(g.Vfix.every((v) => v === 0)).toBe(true);
    expect(g.phase.every((v) => v === 0)).toBe(true);
  });
});

describe("applyModulatedFixed", () => {
  it("sets fixed cells to Vfix*sin(omegaT+phase), leaves non-fixed cells untouched", () => {
    const N = 5;
    const g = createGrid(N);
    paintCell(g, 1, 1, "pos", 100, 0);
    g.V[idx(2, 2, N)] = 77; // non-fixed sentinel

    applyModulatedFixed(g, Math.PI / 2);
    const k = idx(1, 1, N);
    expect(g.V[k]).toBeCloseTo(100 * Math.sin(Math.PI / 2), 6);
    expect(g.V[idx(2, 2, N)]).toBe(77);
  });

  it("phase offset changes the modulated result", () => {
    const N = 5;
    const gA = createGrid(N);
    const gB = createGrid(N);
    paintCell(gA, 1, 1, "pos", 100, 0);
    paintCell(gB, 1, 1, "pos", 100, Math.PI / 2);
    applyModulatedFixed(gA, 0.3);
    applyModulatedFixed(gB, 0.3);
    const kA = idx(1, 1, N);
    expect(gA.V[kA] as number).not.toBeCloseTo(gB.V[kA] as number, 6);
  });
});
