import { describe, expect, it } from "vitest";

import { curveSeries, fitQuadratic, summarizeCurves } from "./lab2Curvas";
import { deltaFromAcceptedPct, MU0_ACCEPTED } from "./lab2Geometria";

describe("stepped runs", () => {
  it("carries three runs with aligned channels", () => {
    expect(curveSeries.length).toBe(3);
    for (const s of curveSeries) {
      expect(s.currentA.length).toBe(s.forceMn.length);
      expect(s.n.length).toBe(s.currentA.length);
      expect(s.currentA.length).toBeGreaterThanOrEqual(9);
    }
  });

  it("sweeps monotonically up to the 20 A thermal limit", () => {
    for (const s of curveSeries) {
      for (let k = 1; k < s.currentA.length; k++) {
        expect(s.currentA[k]).toBeGreaterThan(s.currentA[k - 1] ?? 0);
      }
      expect(s.currentA[s.currentA.length - 1]).toBeGreaterThan(19);
      expect(s.currentA[s.currentA.length - 1]).toBeLessThan(21);
    }
  });
});

describe("fitQuadratic", () => {
  it("recovers an exact F = a·I² + b", () => {
    const currentA = Float64Array.from([2, 4, 6, 8, 10]);
    const forceMn = Float64Array.from(currentA, (i) => 0.02 * i * i + 0.1);
    const fit = fitQuadratic(currentA, forceMn);
    expect(fit.slopeMnPerA2).toBeCloseTo(0.02, 12);
    expect(fit.interceptMn).toBeCloseTo(0.1, 12);
    expect(fit.r2).toBeCloseTo(1, 12);
    expect(fit.maxCurrentA).toBe(10);
  });

  it("finds the measured runs almost perfectly quadratic", () => {
    for (const s of curveSeries) {
      const fit = fitQuadratic(s.currentA, s.forceMn);
      expect(fit.r2).toBeGreaterThan(0.999);
      // Residual tare after the F9 zeroing, well under a tenth of a mN.
      expect(Math.abs(fit.interceptMn)).toBeLessThan(0.1);
    }
  });
});

describe("summarizeCurves", () => {
  const s = summarizeCurves();

  it("finds the three runs repeatable to within a percent", () => {
    // §3.2(f) asked for different separations; these are clearly the same one.
    expect(s.slopeSpreadPct).toBeLessThan(1);
  });

  it("puts the ideal model well below the accepted μ₀, and all three the same way", () => {
    for (const fit of s.fits) {
      const delta = deltaFromAcceptedPct(fit.mu0IdealHPerM);
      expect(delta).toBeLessThan(-15);
      expect(delta).toBeGreaterThan(-20);
    }
    expect(deltaFromAcceptedPct(s.meanMu0IdealHPerM)).toBeLessThan(-15);
  });

  it("brings μ₀ inside a few percent once the loop returns are kept in", () => {
    expect(
      Math.abs(deltaFromAcceptedPct(s.meanMu0CorrectedHPerM)),
    ).toBeLessThan(5);
    expect(s.meanMu0CorrectedHPerM).toBeGreaterThan(s.meanMu0IdealHPerM);
  });

  it("reports the separation the ideal model would have needed", () => {
    // Roughly 20 % beyond the measured 3.00 mm — the distance that stands in
    // for the force the return conductors subtract.
    for (const r of s.impliedSeparationM) {
      expect(r * 1000).toBeGreaterThan(3.4);
      expect(r * 1000).toBeLessThan(3.9);
    }
  });

  it("keeps the implied separation consistent with the μ₀ it came from", () => {
    const fit = s.fits[0];
    const implied = s.impliedSeparationM[0];
    expect(fit).toBeDefined();
    expect(implied).toBeDefined();
    // r and μ₀ are proportional in the ideal model, so scaling one scales
    // the other by the same ratio.
    expect((implied as number) / 0.0029975).toBeCloseTo(
      MU0_ACCEPTED / (fit as { mu0IdealHPerM: number }).mu0IdealHPerM,
      9,
    );
  });
});
