import { describe, expect, test } from "vitest";
import { decodeShare, encodeShare, type SharePayload } from "@/lib/share";

const payload2d: SharePayload = {
  mode: "2d",
  preset: "threephase",
  ac: { enabled: true, periodSec: 3.5 },
  display: {
    heatmap: true,
    equipotentials: false,
    arrows: true,
    streamlines: false,
    surface3D: true,
  },
};

const payload3d: SharePayload = {
  mode: "3d",
  preset: "coax",
  display: { equipotentials: true, fieldLines: false },
};

describe("share links", () => {
  test("2D payload round-trips through encode/decode", () => {
    expect(decodeShare(encodeShare(payload2d))).toEqual(payload2d);
  });

  test("3D payload round-trips through encode/decode", () => {
    expect(decodeShare(encodeShare(payload3d))).toEqual(payload3d);
  });

  test("encoded query string is human-readable (mode & preset in the clear)", () => {
    const s2 = encodeShare(payload2d);
    expect(s2).toContain("mode=2d");
    expect(s2).toContain("preset=threephase");
    expect(s2).toContain("ac=1");
    expect(s2).toContain("acPeriod=3.5");
    const s3 = encodeShare(payload3d);
    expect(s3).toContain("mode=3d");
    expect(s3).toContain("preset=coax");
    expect(s3).toContain("fieldlines=0");
  });

  test("invalid preset id for the mode returns null", () => {
    // 2D preset namespace has no "coax"
    expect(decodeShare("mode=2d&preset=coax")).toBeNull();
    // 3D preset namespace has no "coaxial"
    expect(decodeShare("mode=3d&preset=coaxial")).toBeNull();
  });

  test("unknown or missing mode returns null", () => {
    expect(decodeShare("mode=xr&preset=threephase")).toBeNull();
    expect(decodeShare("preset=threephase")).toBeNull();
  });

  test("missing preset returns null", () => {
    expect(decodeShare("mode=2d")).toBeNull();
  });

  test("malformed input returns null and never throws", () => {
    expect(() => decodeShare("not a query string!!")).not.toThrow();
    expect(decodeShare("")).toBeNull();
    expect(decodeShare("####")).toBeNull();
  });

  test("missing boolean flags default to false; bad acPeriod defaults to 5", () => {
    const decoded = decodeShare("mode=2d&preset=parallel");
    expect(decoded).toEqual({
      mode: "2d",
      preset: "parallel",
      ac: { enabled: false, periodSec: 5 },
      display: {
        heatmap: false,
        equipotentials: false,
        arrows: false,
        streamlines: false,
        surface3D: false,
      },
    });
  });
});
