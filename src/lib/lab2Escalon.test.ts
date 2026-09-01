import { describe, expect, it } from "vitest";

import { summarizeCurves } from "./lab2Curvas";
import { deltaFromAcceptedPct } from "./lab2Geometria";
import {
  analyzeStep,
  stepCurrentA,
  stepForceMn,
  stepTime,
  STEP_DT_S,
} from "./lab2Escalon";

describe("escalón capture", () => {
  it("carries 1001 aligned samples over one second", () => {
    expect(stepForceMn.length).toBe(1001);
    expect(stepCurrentA.length).toBe(1001);
    expect(STEP_DT_S).toBe(0.001);
    expect(stepTime(stepForceMn.length - 1)).toBeCloseTo(1, 9);
  });

  it("has a current channel that steps within a few milliseconds", () => {
    expect(stepCurrentA[0]).toBeLessThan(5);
    expect(stepCurrentA[10]).toBeGreaterThan(20);
  });
});

describe("analyzeStep", () => {
  const a = analyzeStep();

  it("recovers the steady-state plateaus", () => {
    expect(a.forceSteadyMn).toBeGreaterThan(6.5);
    expect(a.forceSteadyMn).toBeLessThan(7.2);
    expect(a.currentSteadyA).toBeGreaterThan(20);
    expect(a.currentSteadyA).toBeLessThan(21);
  });

  it("has the current settle far sooner than the force", () => {
    // This is the whole point of the capture: everything after the current's
    // arrival belongs to the sensor, not to the field.
    expect(a.currentSettledS).toBeLessThan(0.02);
    expect(a.settlingTimeS).toBeGreaterThan(10 * a.currentSettledS);
  });

  it("overshoots and comes back, like an underdamped 2nd-order system", () => {
    expect(a.peakMn).toBeGreaterThan(a.forceSteadyMn);
    expect(a.overshootPct).toBeGreaterThan(1);
    expect(a.overshootPct).toBeLessThan(20);
    expect(a.zeta).toBeGreaterThan(0);
    expect(a.zeta).toBeLessThan(1);
    expect(a.naturalFreqHz).toBeGreaterThan(0);
  });

  it("orders the characteristic times the way a step response must", () => {
    expect(a.t10S).toBeLessThan(a.t90S);
    expect(a.t90S).toBeLessThanOrEqual(a.peakTimeS);
    expect(a.peakTimeS).toBeLessThanOrEqual(a.settlingTimeS);
    expect(a.riseTimeS).toBeCloseTo(a.t90S - a.t10S, 12);
  });

  it("agrees with the stepped runs on the slope", () => {
    const curves = summarizeCurves();
    const delta =
      Math.abs(a.slopeMnPerA2 - curves.meanSlopeMnPerA2) /
      curves.meanSlopeMnPerA2;
    expect(delta).toBeLessThan(0.02);
  });

  it("lands in the same place as the other routes on μ₀", () => {
    expect(deltaFromAcceptedPct(a.mu0IdealHPerM)).toBeLessThan(-15);
    expect(Math.abs(deltaFromAcceptedPct(a.mu0CorrectedHPerM))).toBeLessThan(5);
  });

  it("reports the tightest error budget of any single point", () => {
    // Highest current the bench allows, so the smallest relative force error.
    expect(a.error.dominant).toBe("separation");
    expect(a.error.relativePct).toBeLessThan(6);
  });
});
