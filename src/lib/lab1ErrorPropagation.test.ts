import { describe, expect, it } from "vitest";

import { buildFieldErrorTable, propagatePointError } from "./lab1ErrorPropagation";

// Reference numbers from the professor's own worked example (ensayo1.pdf):
// I, F pairs with l = 8 cm, and the resulting B / ΔB he reports.
const EXAMPLE_L_M = 0.08;
const EXAMPLE_ROWS: Array<[number, number, number, number]> = [
  // I [A], F [mN], expected B [mT], expected ΔB [mT]
  [2.23, 0.25, 1.398, 0.058],
  [4.38, 0.6, 1.712, 0.071],
  [6.09, 0.84, 1.724, 0.071],
  [19.0, 2.54, 1.671, 0.069],
];

describe("propagatePointError", () => {
  it.each(EXAMPLE_ROWS)(
    "matches the professor's worked example at I=%f A",
    (currentA, forceMn, expectedFieldMt, expectedErrorMt) => {
      const point = propagatePointError(forceMn, currentA, EXAMPLE_L_M);
      expect(point.fieldMt).toBeCloseTo(expectedFieldMt, 2);
      expect(point.errorMt).toBeCloseTo(expectedErrorMt, 2);
      expect(point.upperMt).toBeCloseTo(point.fieldMt + point.errorMt, 6);
      expect(point.lowerMt).toBeCloseTo(point.fieldMt - point.errorMt, 6);
    },
  );

  it("flags whether a reference value falls within the point's own band", () => {
    const inBand = propagatePointError(0.6, 4.38, EXAMPLE_L_M, 1.67);
    expect(inBand.containsReference).toBe(true);

    const outOfBand = propagatePointError(0.6, 4.38, EXAMPLE_L_M, 5);
    expect(outOfBand.containsReference).toBe(false);
  });
});

describe("buildFieldErrorTable", () => {
  it("skips near-zero-current calibration points", () => {
    const force = [-0.02, 0.26, 0.55];
    const current = [-0.01, 2.04, 4.04];
    const table = buildFieldErrorTable(force, current, EXAMPLE_L_M);
    expect(table.points).toHaveLength(2);
  });

  it("averages the per-point B and ΔB across the table", () => {
    const currents = EXAMPLE_ROWS.map((r) => r[0]);
    const forces = EXAMPLE_ROWS.map((r) => r[1]);
    const table = buildFieldErrorTable(forces, currents, EXAMPLE_L_M);
    expect(table.points).toHaveLength(EXAMPLE_ROWS.length);
    expect(table.meanFieldMt).toBeGreaterThan(1.3);
    expect(table.meanFieldMt).toBeLessThan(1.8);
    expect(table.meanErrorMt).toBeGreaterThan(0);
  });
});
