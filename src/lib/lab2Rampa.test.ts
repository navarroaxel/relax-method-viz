import { describe, expect, it } from "vitest";

import { summarizeCurves } from "./lab2Curvas";
import { deltaFromAcceptedPct } from "./lab2Geometria";
import { analyzeRamp, fitBranch, rampCurrentA, rampForceMn } from "./lab2Rampa";

describe("continuous sweep capture", () => {
  it("carries 314 aligned samples", () => {
    expect(rampCurrentA.length).toBe(314);
    expect(rampForceMn.length).toBe(314);
  });

  it("goes up and comes back down again", () => {
    const first = rampCurrentA[0] ?? 0;
    const last = rampCurrentA[rampCurrentA.length - 1] ?? 0;
    const peak = Math.max(...Array.from(rampCurrentA));
    expect(peak).toBeGreaterThan(19);
    expect(first).toBeLessThan(5);
    expect(last).toBeLessThan(5);
  });
});

describe("fitBranch", () => {
  it("recovers an exact line in I²", () => {
    const currentA = Float64Array.from([1, 2, 3, 4]);
    const forceMn = Float64Array.from(currentA, (i) => 0.5 * i * i - 0.2);
    const fit = fitBranch(currentA, forceMn, [0, 1, 2, 3]);
    expect(fit.slopeMnPerA2).toBeCloseTo(0.5, 12);
    expect(fit.interceptMn).toBeCloseTo(-0.2, 12);
    expect(fit.r2).toBeCloseTo(1, 12);
  });
});

describe("analyzeRamp", () => {
  const r = analyzeRamp();

  it("splits the sweep at its turning point", () => {
    expect(r.peakIndex).toBeGreaterThan(0);
    expect(r.peakIndex).toBeLessThan(rampCurrentA.length - 1);
    expect(r.peakCurrentA).toBeGreaterThan(19);
  });

  it("stays quadratic across both branches", () => {
    expect(r.overall.r2).toBeGreaterThan(0.99);
    expect(r.rising.r2).toBeGreaterThan(0.99);
    expect(r.falling.r2).toBeGreaterThan(0.99);
  });

  it("opens a hysteresis loop, but a narrow one", () => {
    // The knob moved slowly next to the sensor's settling time, so the two
    // branches nearly retrace — unlike lab 1's much faster sweep.
    expect(Math.abs(r.gapMn)).toBeGreaterThan(0);
    expect(r.hysteresisPct).toBeLessThan(3);
  });

  it("agrees with the stepped runs on the slope", () => {
    const curves = summarizeCurves();
    const delta =
      Math.abs(r.overall.slopeMnPerA2 - curves.meanSlopeMnPerA2) /
      curves.meanSlopeMnPerA2;
    expect(delta).toBeLessThan(0.02);
  });

  it("lands in the same place as the other routes on μ₀", () => {
    expect(deltaFromAcceptedPct(r.mu0IdealHPerM)).toBeLessThan(-15);
    const delta = Math.abs(deltaFromAcceptedPct(r.mu0CorrectedHPerM));
    expect(delta).toBeLessThan(15);
    expect(delta).toBeGreaterThan(10);
  });
});
