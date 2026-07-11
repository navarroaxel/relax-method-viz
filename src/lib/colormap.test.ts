import { describe, it, expect } from "vitest";
import { divergentColor, WHITE, RED, BLUE } from "@/lib/colormap";

describe("divergentColor", () => {
  it("returns WHITE at v=0", () => {
    expect(divergentColor(0, 100)).toEqual([WHITE[0], WHITE[1], WHITE[2]]);
  });

  it("returns RED at v=vmax", () => {
    expect(divergentColor(100, 100)).toEqual([RED[0], RED[1], RED[2]]);
  });

  it("returns BLUE at v=-vmax", () => {
    expect(divergentColor(-100, 100)).toEqual([BLUE[0], BLUE[1], BLUE[2]]);
  });

  it("clamps values beyond +/-vmax to the endpoint colors", () => {
    expect(divergentColor(500, 100)).toEqual([RED[0], RED[1], RED[2]]);
    expect(divergentColor(-500, 100)).toEqual([BLUE[0], BLUE[1], BLUE[2]]);
  });

  it("returns WHITE when vmax <= 0", () => {
    expect(divergentColor(50, 0)).toEqual([WHITE[0], WHITE[1], WHITE[2]]);
    expect(divergentColor(50, -10)).toEqual([WHITE[0], WHITE[1], WHITE[2]]);
  });

  it("returns WHITE when vmax is non-finite", () => {
    expect(divergentColor(50, Infinity)).toEqual([WHITE[0], WHITE[1], WHITE[2]]);
    expect(divergentColor(50, NaN)).toEqual([WHITE[0], WHITE[1], WHITE[2]]);
  });
});
