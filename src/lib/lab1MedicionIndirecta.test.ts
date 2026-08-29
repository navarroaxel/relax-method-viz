import { describe, expect, it } from "vitest";

import { LOOP_LENGTH_M } from "./lab1Escalon";
import {
  analyzeIndirectSession,
  indirectSessions,
  summarizeIndirect,
} from "./lab1MedicionIndirecta";

describe("indirect-measurement sessions", () => {
  it("carries four sessions of manual F9 points", () => {
    expect(indirectSessions).toHaveLength(4);
    for (const s of indirectSessions) {
      expect(s.forceMn.length).toBe(s.currentA.length);
      expect(s.n.length).toBe(s.forceMn.length);
    }
  });
});

describe("analyzeIndirectSession", () => {
  it("flags no outlier in a clean session", () => {
    const a = analyzeIndirectSession(indirectSessions[0]!, LOOP_LENGTH_M);
    expect(a.outlierIndices).toEqual([]);
    expect(a.fitAll.fieldMt).toBeCloseTo(a.fitClean.fieldMt, 6);
  });

  it("flags the bench knock in session B without being dragged by it", () => {
    const session = indirectSessions[1]!;
    const a = analyzeIndirectSession(session, LOOP_LENGTH_M);
    // Point n=11 (last of the session): I≈20 A, F jumps 0.67 mN over a step
    // that moves every other point by ~0.2-0.3 mN — the loop grazing the
    // solenoid, or the bench getting bumped.
    expect(a.outlierIndices).toEqual([session.forceMn.length - 1]);
    // Excluding it should pull the fitted field down, back towards the other
    // sessions and the direct-probe value (~1.7 mT).
    expect(a.fitClean.fieldMt).toBeLessThan(a.fitAll.fieldMt);
  });

  it("recovers an injected outlier via the robust MAD rule", () => {
    const force = Float64Array.from([1, 2, 3, 4, 5, 20]);
    const current = Float64Array.from([1, 2, 3, 4, 5, 6]);
    const a = analyzeIndirectSession(
      { label: "test", n: [1, 2, 3, 4, 5, 6], forceMn: force, currentA: current },
      1,
    );
    expect(a.outlierIndices).toEqual([5]);
  });
});

describe("summarizeIndirect", () => {
  const summary = summarizeIndirect(indirectSessions, LOOP_LENGTH_M);

  it("agrees with the direct-probe field within a few percent", () => {
    expect(summary.meanFieldMt).toBeGreaterThan(1.5);
    expect(summary.meanFieldMt).toBeLessThan(1.8);
    expect(summary.fieldSpreadMt).toBeGreaterThan(0);
    expect(summary.fieldSpreadMt).toBeLessThan(0.2);
  });

  it("counts exactly the one flagged point across all sessions", () => {
    expect(summary.totalOutliers).toBe(1);
    expect(summary.totalPoints).toBe(9 + 11 + 11 + 12);
  });
});
