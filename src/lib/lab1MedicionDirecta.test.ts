import { describe, expect, it } from "vitest";

import {
  COIL_CURRENT_A,
  COIL_CURRENT_ERROR_A,
  directFieldMt,
  POSITION_LABELS,
  summarizeDirect,
} from "./lab1MedicionDirecta";

describe("direct-probe capture", () => {
  it("carries 14 points, one label per point", () => {
    expect(directFieldMt.length).toBe(14);
    expect(POSITION_LABELS.length).toBe(14);
  });

  it("read the coil at a fixed, precisely-known current", () => {
    expect(COIL_CURRENT_A).toBeCloseTo(5.04, 6);
    expect(COIL_CURRENT_ERROR_A).toBeLessThan(0.01);
  });
});

describe("summarizeDirect", () => {
  const s = summarizeDirect();

  it("finds a stable centre plateau near the direct-field reference (1.7 mT)", () => {
    expect(s.groups.center.count).toBe(4);
    expect(s.groups.center.meanMt).toBeCloseTo(1.7, 1);
    expect(s.groups.center.stdMt).toBeLessThan(0.05);
  });

  it("finds the end reading near half the centre field, sign-flipped", () => {
    expect(s.groups.end.count).toBe(3);
    expect(s.groups.end.meanMt).toBeLessThan(0);
    expect(s.endToCenterRatio).toBeGreaterThan(0.4);
    expect(s.endToCenterRatio).toBeLessThan(0.6);
  });

  it("finds the outside-the-core points consistent with noise around zero", () => {
    expect(s.groups.outside.count).toBe(7);
    expect(Math.abs(s.groups.outside.meanMt)).toBeLessThan(0.2);
  });
});
