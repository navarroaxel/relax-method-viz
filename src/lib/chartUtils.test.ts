import { describe, it, expect } from "vitest";
import { niceTicks, formatNum } from "@/lib/chartUtils";

describe("niceTicks", () => {
  it("returns [lo] when hi <= lo", () => {
    expect(niceTicks(5, 5, 5)).toEqual([5]);
    expect(niceTicks(5, 3, 5)).toEqual([5]);
  });

  it("produces steps that are 1/2/5 x 10^n and all ticks within [firstTick, hi]", () => {
    const ticks = niceTicks(0, 100, 5);
    expect(ticks.length).toBeGreaterThan(1);
    const step = (ticks[1] as number) - (ticks[0] as number);
    // step should be one of 1,2,5 * 10^n
    const mag = Math.pow(10, Math.floor(Math.log10(step)));
    const norm = step / mag;
    expect([1, 2, 5].some((n) => Math.abs(norm - n) < 1e-9)).toBe(true);
    for (let k = 1; k < ticks.length; k++) {
      expect((ticks[k] as number) - (ticks[k - 1] as number)).toBeCloseTo(
        step,
        6,
      );
    }
    for (const t of ticks) {
      expect(t).toBeGreaterThanOrEqual(ticks[0] as number);
      expect(t).toBeLessThanOrEqual(100 + 1e-6);
    }
  });

  it("emits an exact 0 for a tick near zero", () => {
    const ticks = niceTicks(-10, 10, 5);
    expect(ticks).toContain(0);
    const zero = ticks.find((t) => t === 0);
    expect(Object.is(zero, -0)).toBe(false);
  });
});

describe("formatNum", () => {
  it("uses exponential notation for magnitudes >= 1000", () => {
    expect(formatNum(1000)).toMatch(/e/);
    expect(formatNum(123456)).toMatch(/e/);
  });

  it("uses exponential notation for magnitudes < 0.01", () => {
    expect(formatNum(0.005)).toMatch(/e/);
    expect(formatNum(-0.001)).toMatch(/e/);
  });

  it("uses no decimals for [100, 1000)", () => {
    expect(formatNum(123.456)).toBe("123");
    expect(formatNum(999)).toBe("999");
  });

  it("uses 1 decimal for [10, 100)", () => {
    expect(formatNum(12.34)).toBe("12.3");
  });

  it("uses 2 decimals for < 10", () => {
    expect(formatNum(1.2345)).toBe("1.23");
    expect(formatNum(0.5)).toBe("0.50");
  });

  it("formats 0 as '0'", () => {
    expect(formatNum(0)).toBe("0");
    expect(formatNum(-0)).toBe("0");
  });
});
