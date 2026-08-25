import { describe, it, expect } from "vitest";
import { createGrid } from "@/lib/grid";
import { PRESETS, PRESET_ORDER, type PresetId } from "@/lib/presets";

const SIZES = [80, 120, 200];

describe("PRESET_ORDER / PRESETS consistency", () => {
  it("PRESET_ORDER contains exactly the keys of PRESETS, no dupes", () => {
    const orderSet = new Set(PRESET_ORDER);
    const keys = Object.keys(PRESETS) as PresetId[];
    const keySet = new Set(keys);
    expect(orderSet.size).toBe(PRESET_ORDER.length); // no dupes
    expect(orderSet.size).toBe(keySet.size);
    for (const id of PRESET_ORDER) expect(keySet.has(id)).toBe(true);
    for (const id of keys) expect(orderSet.has(id)).toBe(true);
  });
});

function fixedCells(
  g: ReturnType<typeof createGrid>,
): { i: number; j: number; k: number }[] {
  const { N, fixed } = g;
  const out: { i: number; j: number; k: number }[] = [];
  for (let k = 0; k < fixed.length; k++) {
    if (fixed[k] === 1) {
      const i = Math.floor(k / N);
      const j = k % N;
      out.push({ i, j, k });
    }
  }
  return out;
}

describe.each(PRESET_ORDER)("preset %s", (id) => {
  it.each(SIZES)("has at least one fixed cell (N=%i)", (N) => {
    const g = createGrid(N);
    PRESETS[id].apply(g);
    const cells = fixedCells(g);
    expect(cells.length).toBeGreaterThan(0);
  });

  it.each(SIZES)(
    "boundary-safety invariant: no fixed cell on row/col 0 or N-1 (N=%i)",
    (N) => {
      const g = createGrid(N);
      PRESETS[id].apply(g);
      const cells = fixedCells(g);
      const offenders = cells.filter(
        (c) => c.i < 1 || c.i > N - 2 || c.j < 1 || c.j > N - 2,
      );
      expect(
        offenders,
        `preset "${id}" at N=${N} placed ${offenders.length} fixed cell(s) on the boundary row/col: ${JSON.stringify(
          offenders.slice(0, 5),
        )}`,
      ).toEqual([]);
    },
  );

  it.each(SIZES)("apply is idempotent (N=%i)", (N) => {
    const g1 = createGrid(N);
    PRESETS[id].apply(g1);
    const V1 = g1.V.slice();
    const fixed1 = g1.fixed.slice();
    const Vfix1 = g1.Vfix.slice();
    const phase1 = g1.phase.slice();

    PRESETS[id].apply(g1);
    expect(g1.V).toEqual(V1);
    expect(g1.fixed).toEqual(fixed1);
    expect(g1.Vfix).toEqual(Vfix1);
    expect(g1.phase).toEqual(phase1);
  });
});

describe("preset-specific voltage/geometry checks", () => {
  it.each(SIZES)(
    "parallel: has both +100kV and -100kV fixed cells (N=%i)",
    (N) => {
      const g = createGrid(N);
      PRESETS.parallel.apply(g);
      const vals = new Set<number>();
      for (let k = 0; k < g.fixed.length; k++) {
        if (g.fixed[k] === 1) vals.add(g.Vfix[k] as number);
      }
      expect(vals.has(100_000)).toBe(true);
      expect(vals.has(-100_000)).toBe(true);
    },
  );

  it.each(SIZES)("dipole: has opposite-sign disc voltages (N=%i)", (N) => {
    const g = createGrid(N);
    PRESETS.dipole.apply(g);
    const vals = new Set<number>();
    for (let k = 0; k < g.fixed.length; k++) {
      if (g.fixed[k] === 1) vals.add(g.Vfix[k] as number);
    }
    expect(vals.has(100_000)).toBe(true);
    expect(vals.has(-100_000)).toBe(true);
  });

  it.each(SIZES)("coaxial: has a 0V ring and a +80V core (N=%i)", (N) => {
    const g = createGrid(N);
    PRESETS.coaxial.apply(g);
    const vals = new Set<number>();
    for (let k = 0; k < g.fixed.length; k++) {
      if (g.fixed[k] === 1) vals.add(g.Vfix[k] as number);
    }
    expect(vals.has(0)).toBe(true);
    expect(vals.has(80)).toBe(true);
  });

  // Vfix is a Float32Array, so a float64 constant like sqrt(2/3)*500_000
  // loses precision on storage (~0.05 absolute error at this magnitude) —
  // use a tolerance-based comparison rather than exact/near-exact equality.
  it.each(SIZES)(
    "subconductors: has cells at V1 = sqrt(2/3)*500kV (N=%i)",
    (N) => {
      const g = createGrid(N);
      PRESETS.subconductors.apply(g);
      const V1 = Math.sqrt(2 / 3) * 500_000;
      let found = false;
      for (let k = 0; k < g.fixed.length; k++) {
        if (g.fixed[k] === 1 && Math.abs((g.Vfix[k] as number) - V1) < 1) {
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    },
  );

  it.each(SIZES)(
    "singleconductor: has cells at V1 = sqrt(2/3)*500kV, a grounded plane, and a single central disc (N=%i)",
    (N) => {
      const g = createGrid(N);
      PRESETS.singleconductor.apply(g);
      const V1 = Math.sqrt(2 / 3) * 500_000;
      const sc = (x: number) => Math.round((x * N) / 80);
      const ci = sc(40);
      const cj = sc(30);
      // A single disc of radius sc(2); allow slack for rasterization/rounding.
      const maxDist = sc(2) + 2;
      let hasV1 = false;
      let hasGround = false;
      let v1CellsAllCentral = true;
      for (let k = 0; k < g.fixed.length; k++) {
        if (g.fixed[k] !== 1) continue;
        const v = g.Vfix[k] as number;
        if (v === 0) hasGround = true;
        if (Math.abs(v - V1) < 1) {
          hasV1 = true;
          // idx(i, j, N) = i * N + j
          const i = Math.floor(k / N);
          const j = k % N;
          if (Math.hypot(i - ci, j - cj) > maxDist) v1CellsAllCentral = false;
        }
      }
      expect(hasV1).toBe(true);
      expect(hasGround).toBe(true);
      // Distinguishes the single central disc from the 4-disc bundle layout.
      expect(v1CellsAllCentral).toBe(true);
    },
  );

  it.each(SIZES)(
    "threephase: has cells at V1 = sqrt(2/3)*500kV (N=%i)",
    (N) => {
      const g = createGrid(N);
      PRESETS.threephase.apply(g);
      const V1 = Math.sqrt(2 / 3) * 500_000;
      let found = false;
      for (let k = 0; k < g.fixed.length; k++) {
        if (g.fixed[k] === 1 && Math.abs((g.Vfix[k] as number) - V1) < 1) {
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    },
  );

  it.each(SIZES)(
    "threephase: has >=3 distinct nonzero phase values plus a grounded (0V) disc (N=%i)",
    (N) => {
      const g = createGrid(N);
      PRESETS.threephase.apply(g);
      // phase is a Float32Array, so compare against the double constants
      // with a tolerance rather than exact equality.
      const PHI = (2 * Math.PI) / 3;
      const near = (a: number, b: number) => Math.abs(a - b) < 1e-4;
      let hasZeroPhase = false;
      let hasPhiPhase = false;
      let hasTwoPhiPhase = false;
      let hasGroundedFixed = false;
      const distinctNonZero: number[] = [];
      for (let k = 0; k < g.fixed.length; k++) {
        if (g.fixed[k] !== 1) continue;
        const ph = g.phase[k] as number;
        if (near(ph, 0)) hasZeroPhase = true;
        if (near(ph, PHI)) hasPhiPhase = true;
        if (near(ph, 2 * PHI)) hasTwoPhiPhase = true;
        if (ph !== 0 && !distinctNonZero.some((p) => near(p, ph))) {
          distinctNonZero.push(ph);
        }
        if ((g.Vfix[k] as number) === 0) hasGroundedFixed = true;
      }
      expect(distinctNonZero.length).toBeGreaterThanOrEqual(2); // PHI and 2*PHI
      expect(hasZeroPhase).toBe(true);
      expect(hasPhiPhase).toBe(true);
      expect(hasTwoPhiPhase).toBe(true);
      expect(hasGroundedFixed).toBe(true);
    },
  );

  it.each(SIZES)(
    "tip: triangle tip is present (nonzero +80V cells beyond the plate)",
    (N) => {
      const g = createGrid(N);
      PRESETS.tip.apply(g);
      let plusCount = 0;
      for (let k = 0; k < g.fixed.length; k++) {
        if (g.fixed[k] === 1 && (g.Vfix[k] as number) === 80) plusCount++;
      }
      expect(plusCount).toBeGreaterThan(0);
    },
  );

  it.each(SIZES)("conductors: has +100kV and -100kV plates (N=%i)", (N) => {
    const g = createGrid(N);
    PRESETS.conductors.apply(g);
    const vals = new Set<number>();
    for (let k = 0; k < g.fixed.length; k++) {
      if (g.fixed[k] === 1) vals.add(g.Vfix[k] as number);
    }
    expect(vals.has(100_000)).toBe(true);
    expect(vals.has(-100_000)).toBe(true);
  });
});
