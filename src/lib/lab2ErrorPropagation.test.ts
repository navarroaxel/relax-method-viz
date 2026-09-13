import { describe, expect, it } from "vitest";

import { errorTerms, MU0_ACCEPTED } from "./lab2Geometry";
import { buildMu0ErrorTable, propagatePointMu0Error } from "./lab2ErrorPropagation";

describe("propagatePointMu0Error", () => {
  it("matches errorTerms at the same operating point", () => {
    const p = propagatePointMu0Error(20, 6.9);
    const e = errorTerms(20, 6.9);
    expect(p.mu0HPerM).toBeCloseTo(e.mu0, 15);
    expect(p.errorHPerM).toBeCloseTo(e.totalAbs, 15);
    expect(p.upperHPerM).toBeCloseTo(p.mu0HPerM + p.errorHPerM, 15);
    expect(p.lowerHPerM).toBeCloseTo(p.mu0HPerM - p.errorHPerM, 15);
    expect(p.errorPct).toBeCloseTo(e.relativePct, 12);
  });

  it("flags whether a reference value falls within the point's own band", () => {
    const inBand = propagatePointMu0Error(20, 6.9, MU0_ACCEPTED);
    expect(inBand.containsReference).toBe(
      MU0_ACCEPTED >= inBand.lowerHPerM && MU0_ACCEPTED <= inBand.upperHPerM,
    );

    const outOfBand = propagatePointMu0Error(20, 6.9, MU0_ACCEPTED * 10);
    expect(outOfBand.containsReference).toBe(false);
  });
});

describe("buildMu0ErrorTable", () => {
  const currents = Float64Array.from([4.89, 6.65, 9.09, 10.92, 12.88]);
  const forces = Float64Array.from([0.47, 0.83, 1.42, 1.99, 2.8]);

  it("builds one row per point above the current threshold", () => {
    const table = buildMu0ErrorTable(currents, forces);
    expect(table.points).toHaveLength(currents.length);
  });

  it("skips near-zero-current calibration points", () => {
    const withTare = Float64Array.from([0.01, ...currents]);
    const withTareForces = Float64Array.from([0.0, ...forces]);
    const table = buildMu0ErrorTable(withTare, withTareForces);
    expect(table.points).toHaveLength(currents.length);
  });

  it("averages the per-point μ₀ and Δμ₀ across the table", () => {
    const table = buildMu0ErrorTable(currents, forces);
    expect(table.meanMu0HPerM).toBeGreaterThan(0);
    expect(table.meanErrorHPerM).toBeGreaterThan(0);
    expect(table.spreadHPerM).toBeGreaterThanOrEqual(0);
  });
});
