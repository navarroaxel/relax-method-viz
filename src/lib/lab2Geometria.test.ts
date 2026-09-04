import { describe, expect, it } from "vitest";

import {
  deltaFromAcceptedPct,
  dominantCrossoverA,
  errorTerms,
  FORCE_LENGTH_M,
  geometryFactor,
  MEAN_DIAMETER_M,
  mu0FromSlopeCorrected,
  mu0FromSlopeIdeal,
  MU0_ACCEPTED,
  SEPARATION_M,
  UPPER_LENGTH_M,
  UPPER_LOOP_HEIGHT_M,
} from "./lab2Geometria";

describe("bench dimensions", () => {
  it("takes r as the clear gap plus one mean wire diameter", () => {
    expect(MEAN_DIAMETER_M).toBeCloseTo(0.0019975, 7);
    expect(SEPARATION_M).toBeCloseTo(0.0029975, 7);
  });

  it("converts the caliper reading to a centre-to-centre loop height", () => {
    // 60.1 mm was read outside to outside, so a diameter comes off.
    expect(UPPER_LOOP_HEIGHT_M).toBeCloseTo(0.0581, 4);
  });

  it("uses the sensor-carrying conductor as l, not the longer one", () => {
    expect(FORCE_LENGTH_M).toBe(UPPER_LENGTH_M);
  });
});

describe("geometryFactor", () => {
  const f = geometryFactor();

  it("cancels a modest fraction of the ideal two-wire force", () => {
    expect(f.idealPerM).toBeCloseTo(1 / SEPARATION_M, 6);
    expect(f.factorPerM).toBeLessThan(f.idealPerM);
    expect(f.shortfallPct).toBeGreaterThan(4);
    expect(f.shortfallPct).toBeLessThan(6);
  });

  it("collapses back onto 1/r as the suspended loop is made infinitely tall", () => {
    const tall = geometryFactor(SEPARATION_M, 1e6);
    expect(tall.ratio).toBeCloseTo(1, 5);
  });

  it("cancels more of the force as the suspended loop is made shorter", () => {
    const short = geometryFactor(SEPARATION_M, 0.01);
    expect(short.shortfallPct).toBeGreaterThan(f.shortfallPct);
  });
});

describe("mu0 from a fitted slope", () => {
  // Slope that the ideal model would need in order to return exactly μ₀.
  const idealSlopeMnPerA2 =
    ((MU0_ACCEPTED * FORCE_LENGTH_M) / (2 * Math.PI * SEPARATION_M)) * 1e3;

  it("inverts the guide's formula exactly", () => {
    expect(mu0FromSlopeIdeal(idealSlopeMnPerA2)).toBeCloseTo(MU0_ACCEPTED, 12);
  });

  it("returns a larger value than the ideal model for the same slope", () => {
    // The real geometry produces less force per amp², so the same measured
    // slope has to be explained by a bigger μ₀.
    expect(mu0FromSlopeCorrected(idealSlopeMnPerA2)).toBeGreaterThan(
      mu0FromSlopeIdeal(idealSlopeMnPerA2),
    );
  });

  it("scales linearly with the slope", () => {
    expect(mu0FromSlopeIdeal(2 * idealSlopeMnPerA2)).toBeCloseTo(
      2 * mu0FromSlopeIdeal(idealSlopeMnPerA2),
      12,
    );
  });
});

describe("errorTerms", () => {
  it("matches the relative form 2ΔI/I + Δl/l + ΔF/F + Δr/r", () => {
    const e = errorTerms(20, 6.9);
    const expected =
      (2 * 0.05) / 20 +
      0.001 / FORCE_LENGTH_M +
      0.05 / 6.9 +
      0.0001 / SEPARATION_M;
    expect(e.relativePct).toBeCloseTo(expected * 100, 9);
    expect(e.totalAbs).toBeCloseTo(
      e.fromCurrent + e.fromLength + e.fromForce + e.fromSeparation,
      15,
    );
  });

  it("is dominated by the separation at the top of the current range", () => {
    const e = errorTerms(20.4, 6.92);
    expect(e.dominant).toBe("separation");
    expect(e.fromSeparation / e.totalAbs).toBeGreaterThan(0.5);
  });

  it("is dominated by the force reading at low current", () => {
    const e = errorTerms(3, 0.15);
    expect(e.dominant).toBe("force");
    // The whole budget blows up down there — the point is nearly worthless.
    expect(e.relativePct).toBeGreaterThan(30);
  });

  it("never lets the length term lead", () => {
    for (const i of [3, 5, 10, 15, 20]) {
      const e = errorTerms(i, 0.0166 * i * i);
      expect(e.dominant).not.toBe("length");
    }
  });
});

describe("dominantCrossoverA", () => {
  const slope = 0.0166;
  const crossover = dominantCrossoverA(slope, 21);

  it("falls inside the sweep the bench can reach", () => {
    expect(crossover).not.toBeNull();
    expect(crossover as number).toBeGreaterThan(2);
    expect(crossover as number).toBeLessThan(21);
  });

  it("marks the point where the force and separation terms swap places", () => {
    const i = crossover as number;
    const below = errorTerms(i - 1, slope * (i - 1) ** 2);
    const above = errorTerms(i + 1, slope * (i + 1) ** 2);
    expect(below.dominant).toBe("force");
    expect(above.dominant).toBe("separation");
  });

  it("returns null when the crossover sits beyond the reachable current", () => {
    expect(dominantCrossoverA(slope, 2)).toBeNull();
  });
});

describe("deltaFromAcceptedPct", () => {
  it("is zero at the accepted value and signed either side of it", () => {
    expect(deltaFromAcceptedPct(MU0_ACCEPTED)).toBeCloseTo(0, 12);
    expect(deltaFromAcceptedPct(MU0_ACCEPTED * 1.1)).toBeCloseTo(10, 9);
    expect(deltaFromAcceptedPct(MU0_ACCEPTED * 0.9)).toBeCloseTo(-10, 9);
  });
});
