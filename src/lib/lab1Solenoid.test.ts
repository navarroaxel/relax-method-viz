import { describe, expect, it } from "vitest";

import { theoreticalFieldMt } from "./lab1Solenoid";

describe("theoreticalFieldMt", () => {
  it("matches the day-of-practice back-of-envelope figure (120 turns, 0.4 m, 5 A)", () => {
    const t = theoreticalFieldMt(5, 0, 120, 0.4, 0);
    expect(t.fieldMt).toBeCloseTo(1.885, 2);
  });

  it("with the precisely measured length and current, comes out above the measured field", () => {
    const t = theoreticalFieldMt(5.04, 0.005);
    expect(t.fieldMt).toBeGreaterThan(1.8);
    expect(t.fieldMt).toBeLessThan(1.9);
    // The propagated error is small — the ~10% gap to the ~1.7 mT measured
    // field is not explained by measurement uncertainty in N, L or I.
    expect(t.errorMt).toBeLessThan(0.01);
  });
});
