import { describe, expect, it } from "vitest";

import {
  analyzeStep,
  effectiveDelayS,
  escalonCurrentA,
  escalonForceMn,
  ESCALON_DT_S,
  LOOP_LENGTH_M,
} from "./lab1Escalon";
import {
  analyzeRamp,
  bestLagSamples,
  branchGap,
  fitLine,
  predictFromStepResponse,
  RAMP_DT_S,
  rampCurrentA,
  rampForceMn,
  rampTime,
} from "./lab1MedicionContinua";

describe("continuous-measurement capture", () => {
  it("carries 201 aligned samples spanning 20 s", () => {
    expect(rampForceMn.length).toBe(201);
    expect(rampCurrentA.length).toBe(201);
    expect(RAMP_DT_S).toBe(0.1);
    expect(rampTime(200)).toBeCloseTo(20, 9);
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
  const a = analyzeRamp(rampForceMn, rampCurrentA, LOOP_LENGTH_M);

  it("finds where the knob turned back", () => {
    expect(a.peakTimeS).toBeCloseTo(11.7, 6);
    expect(a.peakCurrentA).toBeCloseTo(20.36, 6);
    expect(a.startCurrentA).toBeLessThan(2);
    expect(a.endCurrentA).toBeLessThan(a.peakCurrentA);
    expect(a.maxRateAPerS).toBeGreaterThan(1);
  });

  it("fits the sweep to a line through the measured field", () => {
    expect(a.overall.slopeMnPerA).toBeCloseTo(0.1323, 3);
    expect(a.overall.fieldMt).toBeCloseTo(1.634, 2);
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

describe("effectiveDelayS", () => {
  it("is zero for an instantaneous response and the dead time for a pure one", () => {
    const instant = Float64Array.from(Array.from({ length: 100 }, () => 1));
    expect(effectiveDelayS(instant, 1, 0.001)).toBeCloseTo(0, 9);

    // Flat at zero for 20 ms, then exactly at the plateau.
    const delayed = Float64Array.from(
      Array.from({ length: 100 }, (_, k) => (k < 20 ? 0 : 1)),
    );
    expect(effectiveDelayS(delayed, 1, 0.001)).toBeCloseTo(0.02, 9);
  });

  it("is much shorter than the settling time of the real sensor", () => {
    const a = analyzeStep(escalonForceMn, escalonCurrentA);
    expect(a.effectiveDelayS).toBeGreaterThan(0.1);
    expect(a.effectiveDelayS).toBeLessThan(0.16);
    expect(a.effectiveDelayS).toBeLessThan(a.settlingTimeS);
  });
});

describe("predictFromStepResponse", () => {
  const step = analyzeStep(escalonForceMn, escalonCurrentA);
  const oversample = Math.round(RAMP_DT_S / ESCALON_DT_S);
  const perAmp = predictFromStepResponse(
    rampCurrentA,
    escalonForceMn,
    step.forceSteadyMn,
    oversample,
  );

  it("reproduces the measured sweep from the step record alone", () => {
    const ramp = analyzeRamp(rampForceMn, rampCurrentA, LOOP_LENGTH_M);
    const predicted = Float64Array.from(
      perAmp,
      (v) => v * ramp.overall.slopeMnPerA,
    );
    const indices = Array.from({ length: predicted.length }, (_, k) => k);
    const fit = fitLine(rampForceMn, predicted, indices, LOOP_LENGTH_M);
    expect(fit.r2).toBeGreaterThan(0.99);
  });

  it("tracks a slowly varying input with roughly unit gain", () => {
    // Late in the record the sweep is gentle, so the prediction should sit
    // close to the current itself.
    const k = 190;
    expect(perAmp[k] ?? 0).toBeGreaterThan((rampCurrentA[k] ?? 0) * 0.9);
    expect(perAmp[k] ?? 0).toBeLessThan((rampCurrentA[k] ?? 0) * 1.1);
  });

  it("opens a smaller loop than the one actually measured", () => {
    const ramp = analyzeRamp(rampForceMn, rampCurrentA, LOOP_LENGTH_M);
    const predicted = Float64Array.from(
      perAmp,
      (v) => v * ramp.overall.slopeMnPerA,
    );
    const measured = branchGap(rampForceMn, rampCurrentA, ramp.peakIndex);
    const fromLag = branchGap(predicted, rampCurrentA, ramp.peakIndex);
    expect(measured.gapMn).toBeGreaterThan(0);
    expect(fromLag.gapMn).toBeGreaterThan(0);
    // The sensor's delay accounts for part of the hysteresis, not all of it.
    expect(fromLag.gapMn).toBeLessThan(measured.gapMn);
    expect(fromLag.gapMn / measured.gapMn).toBeGreaterThan(0.3);
    expect(fromLag.gapMn / measured.gapMn).toBeLessThan(0.8);
  });
});

describe("branchGap", () => {
  it("is zero when both branches lie on the same line", () => {
    const current = Float64Array.from([1, 2, 3, 4, 3, 2, 1]);
    const values = Float64Array.from(current, (i) => 2 * i + 1);
    const gap = branchGap(values, current, 3);
    expect(gap.gapMn).toBeCloseTo(0, 9);
  });
});
