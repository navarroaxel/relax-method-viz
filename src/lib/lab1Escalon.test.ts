import { describe, expect, it } from "vitest";

import {
  analyzeStep,
  escalonCurrentA,
  escalonForceMn,
  escalonTime,
  ESCALON_DT_S,
  fieldSeriesMt,
  LOOP_LENGTH_M,
} from "./lab1Escalon";

describe("escalón capture", () => {
  it("carries 1001 aligned samples on both channels", () => {
    expect(escalonForceMn.length).toBe(1001);
    expect(escalonCurrentA.length).toBe(1001);
    expect(escalonTime(escalonForceMn.length - 1)).toBeCloseTo(1, 9);
    expect(ESCALON_DT_S).toBe(0.001);
  });

  it("has a current channel that steps within a few milliseconds", () => {
    expect(escalonCurrentA[0]).toBeLessThan(5);
    expect(escalonCurrentA[5]).toBeGreaterThan(19);
  });
});

describe("analyzeStep", () => {
  const a = analyzeStep(escalonForceMn, escalonCurrentA);

  it("recovers the steady-state plateaus", () => {
    expect(a.forceSteadyMn).toBeCloseTo(2.69, 1);
    expect(a.currentSteadyA).toBeCloseTo(20.16, 1);
  });

  it("times the force response well after the current step", () => {
    expect(a.t10S).toBeGreaterThan(0.05);
    expect(a.t90S).toBeGreaterThan(a.t10S);
    expect(a.riseTimeS).toBeCloseTo(a.t90S - a.t10S, 12);
    expect(a.riseTimeS).toBeGreaterThan(0.1);
    expect(a.settlingTimeS).toBeGreaterThan(a.t90S);
  });

  it("finds a small overshoot and an underdamped equivalent system", () => {
    expect(a.peakMn).toBeGreaterThan(a.forceSteadyMn);
    expect(a.overshootPct).toBeGreaterThan(0);
    expect(a.overshootPct).toBeLessThan(20);
    expect(a.zeta).toBeGreaterThan(0);
    expect(a.zeta).toBeLessThan(1);
    expect(a.naturalFreqHz).toBeGreaterThan(0);
  });

  it("derives B = F/(I·l) close to the direct probe reading", () => {
    expect(a.fieldMt).toBeCloseTo(1.67, 1);
  });

  it("scales the field inversely with the loop length", () => {
    const half = analyzeStep(escalonForceMn, escalonCurrentA, LOOP_LENGTH_M / 2);
    expect(half.fieldMt).toBeCloseTo(a.fieldMt * 2, 6);
  });
});

describe("fieldSeriesMt", () => {
  it("matches the steady analysis at the tail and guards against I = 0", () => {
    const b = fieldSeriesMt(escalonForceMn, escalonCurrentA);
    expect(b.length).toBe(escalonForceMn.length);
    expect(b[1000]).toBeCloseTo(
      (escalonForceMn[1000] ?? 0) /
        ((escalonCurrentA[1000] ?? 1) * LOOP_LENGTH_M),
      9,
    );
    const zeroed = fieldSeriesMt(
      Float64Array.from([1, 2]),
      Float64Array.from([0, 10]),
    );
    expect(zeroed[0]).toBe(0);
  });
});
