import { describe, expect, it } from "vitest";

import { percentDelta, summarizeFieldRoutes } from "./lab1FieldSummary";

describe("summarizeFieldRoutes", () => {
  it("averages the four routes and reports their sample spread", () => {
    const s = summarizeFieldRoutes([1.67, 1.65, 1.66, 1.7]);
    expect(s.meanMt).toBeCloseTo(1.67, 3);
    expect(s.stdMt).toBeGreaterThan(0);
    expect(s.stdMt).toBeLessThan(0.05);
  });

  it("is zero-spread when every route agrees exactly", () => {
    const s = summarizeFieldRoutes([1.7, 1.7, 1.7, 1.7]);
    expect(s.meanMt).toBeCloseTo(1.7, 9);
    expect(s.stdMt).toBeCloseTo(0, 9);
  });

  it("falls back to zero spread for a single value rather than dividing by zero", () => {
    const s = summarizeFieldRoutes([1.7]);
    expect(s.meanMt).toBeCloseTo(1.7, 9);
    expect(s.stdMt).toBeCloseTo(0, 9);
  });
});

describe("percentDelta", () => {
  it("recovers the known ~12% gap between theory and the measured average", () => {
    expect(percentDelta(1.872, 1.67)).toBeCloseTo(12.1, 1);
  });

  it("is negative when value sits below the reference", () => {
    expect(percentDelta(90, 100)).toBeCloseTo(-10, 9);
  });

  it("is zero when value equals the reference", () => {
    expect(percentDelta(5, 5)).toBeCloseTo(0, 9);
  });
});
