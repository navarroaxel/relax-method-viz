import { describe, expect, it } from "vitest";

import { LOOP_LENGTH_M } from "./lab1Escalon";
import {
  analyzeRamp,
  bestLagSamples,
  fitLine,
  PROGRESIVO_DT_S,
  progresivoCurrentA,
  progresivoForceMn,
  progresivoTime,
} from "./lab1Progresivo";

describe("progresivo capture", () => {
  it("carries 201 aligned samples spanning 20 s", () => {
    expect(progresivoForceMn.length).toBe(201);
    expect(progresivoCurrentA.length).toBe(201);
    expect(PROGRESIVO_DT_S).toBe(0.1);
    expect(progresivoTime(200)).toBeCloseTo(20, 9);
  });
});

describe("fitLine", () => {
  it("recovers a known line exactly", () => {
    const current = Float64Array.from([1, 2, 3, 4]);
    const force = Float64Array.from([3, 5, 7, 9]); // 2x + 1
    const fit = fitLine(force, current, [0, 1, 2, 3], 0.08);
    expect(fit.slopeMnPerA).toBeCloseTo(2, 9);
    expect(fit.interceptMn).toBeCloseTo(1, 9);
    expect(fit.r2).toBeCloseTo(1, 9);
    expect(fit.fieldMt).toBeCloseTo(2 / 0.08, 9);
  });
});

describe("analyzeRamp", () => {
  const a = analyzeRamp(progresivoForceMn, progresivoCurrentA, LOOP_LENGTH_M);

  it("finds where the knob turned back", () => {
    expect(a.peakTimeS).toBeCloseTo(11.7, 6);
    expect(a.peakCurrentA).toBeCloseTo(20.36, 6);
    expect(a.startCurrentA).toBeLessThan(2);
    expect(a.endCurrentA).toBeLessThan(a.peakCurrentA);
    expect(a.maxRateAPerS).toBeGreaterThan(1);
  });

  it("fits the sweep to a line through the measured field", () => {
    expect(a.overall.slopeMnPerA).toBeCloseTo(0.1323, 3);
    expect(a.overall.fieldMt).toBeCloseTo(1.654, 2);
    expect(a.overall.r2).toBeGreaterThan(0.99);
    // Residual tare: the sensor was not perfectly zeroed.
    expect(Math.abs(a.overall.interceptMn)).toBeLessThan(0.3);
  });

  it("splits into two branches that disagree because the sensor lags", () => {
    expect(a.rising.fieldMt).toBeCloseTo(1.6, 1);
    expect(a.falling.fieldMt).toBeCloseTo(1.77, 1);
    expect(a.falling.fieldMt).toBeGreaterThan(a.rising.fieldMt);
    expect(a.hysteresisPct).toBeGreaterThan(5);
  });

  it("puts the best force-to-current alignment at the sensor's lag", () => {
    expect(a.bestLagS).toBeCloseTo(0.2, 6);
  });
});

describe("bestLagSamples", () => {
  it("recovers a delay injected on purpose", () => {
    const n = 60;
    const current = new Float64Array(n);
    const force = new Float64Array(n);
    for (let k = 0; k < n; k++) current[k] = k;
    // force[k] tracks current[k - 3], i.e. a three-sample lag.
    for (let k = 0; k < n; k++)
      force[k] = 0.5 * (current[Math.max(0, k - 3)] ?? 0);
    const best = bestLagSamples(force, current, 5, 0.08);
    expect(best.lagSamples).toBe(3);
    expect(best.lagS).toBeCloseTo(0.3, 9);
  });
});
