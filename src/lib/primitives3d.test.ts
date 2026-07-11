import { describe, it, expect } from "vitest";
import { createGrid3D, idx3 } from "@/lib/grid3d";
import {
  rasterPlate,
  rasterSphere,
  rasterCylinder,
  rasterWire,
  applyPrimitive3D,
} from "@/lib/primitives3d";
import type { Primitive3D } from "@/types/grid3d";

const N = 20;

describe("rasterPlate", () => {
  it("fills the inclusive AABB between a and b", () => {
    const g = createGrid3D(N);
    rasterPlate(g, [4, 4, 4], [10, 10, 10], 42);
    // Corners of the box
    expect(g.fixed[idx3(4, 4, 4, N)]).toBe(1);
    expect(g.Vfix[idx3(4, 4, 4, N)]).toBe(42);
    expect(g.fixed[idx3(10, 10, 10, N)]).toBe(1);
    expect(g.Vfix[idx3(10, 10, 10, N)]).toBe(42);
    // Center
    expect(g.fixed[idx3(7, 7, 7, N)]).toBe(1);
    expect(g.Vfix[idx3(7, 7, 7, N)]).toBe(42);
    // V is also set (paintVoxel writes V too)
    expect(g.V[idx3(7, 7, 7, N)]).toBe(42);
    // Outside the box, untouched
    expect(g.fixed[idx3(3, 4, 4, N)]).toBe(0);
    expect(g.fixed[idx3(11, 10, 10, N)]).toBe(0);
  });

  it("accepts corners in either order (min/max normalization)", () => {
    const g = createGrid3D(N);
    rasterPlate(g, [10, 10, 10], [4, 4, 4], 7);
    expect(g.fixed[idx3(7, 7, 7, N)]).toBe(1);
    expect(g.Vfix[idx3(7, 7, 7, N)]).toBe(7);
  });

  it("never sets a boundary voxel even when the box reaches the domain edges", () => {
    const g = createGrid3D(N);
    rasterPlate(g, [0, 0, 0], [N - 1, N - 1, N - 1], 5);
    // All 6 boundary faces must remain unset.
    for (let a = 0; a < N; a++) {
      for (let b = 0; b < N; b++) {
        expect(g.fixed[idx3(0, a, b, N)]).toBe(0);
        expect(g.fixed[idx3(N - 1, a, b, N)]).toBe(0);
        expect(g.fixed[idx3(a, 0, b, N)]).toBe(0);
        expect(g.fixed[idx3(a, N - 1, b, N)]).toBe(0);
        expect(g.fixed[idx3(a, b, 0, N)]).toBe(0);
        expect(g.fixed[idx3(a, b, N - 1, N)]).toBe(0);
      }
    }
    // Interior is filled.
    expect(g.fixed[idx3(10, 10, 10, N)]).toBe(1);
    expect(g.Vfix[idx3(10, 10, 10, N)]).toBe(5);
  });

  it("erase=true clears fixed/Vfix/V within the box", () => {
    const g = createGrid3D(N);
    rasterPlate(g, [4, 4, 4], [10, 10, 10], 42);
    rasterPlate(g, [6, 6, 6], [8, 8, 8], 0, true);
    expect(g.fixed[idx3(7, 7, 7, N)]).toBe(0);
    expect(g.Vfix[idx3(7, 7, 7, N)]).toBe(0);
    expect(g.V[idx3(7, 7, 7, N)]).toBe(0);
    // Outside the erased sub-box but inside the original box: still fixed.
    expect(g.fixed[idx3(4, 4, 4, N)]).toBe(1);
  });
});

describe("rasterSphere", () => {
  it("fills cells within radius of the center", () => {
    const g = createGrid3D(N);
    const center: [number, number, number] = [10, 10, 10];
    rasterSphere(g, center, 3, 99);
    // Center cell fixed.
    expect(g.fixed[idx3(10, 10, 10, N)]).toBe(1);
    expect(g.Vfix[idx3(10, 10, 10, N)]).toBe(99);
    // A cell far outside the radius is untouched.
    expect(g.fixed[idx3(10, 10, 17, N)]).toBe(0);
    // At least one cell offset by less than the radius is fixed.
    expect(g.fixed[idx3(11, 10, 10, N)]).toBe(1);
  });

  it("erase=true clears fixed/Vfix/V within the sphere", () => {
    const g = createGrid3D(N);
    const center: [number, number, number] = [10, 10, 10];
    rasterSphere(g, center, 3, 99);
    expect(g.fixed[idx3(10, 10, 10, N)]).toBe(1);
    rasterSphere(g, center, 3, 0, true);
    expect(g.fixed[idx3(10, 10, 10, N)]).toBe(0);
    expect(g.Vfix[idx3(10, 10, 10, N)]).toBe(0);
    expect(g.V[idx3(10, 10, 10, N)]).toBe(0);
  });
});

describe("rasterCylinder", () => {
  it("fills cells within radius of the axis segment", () => {
    const g = createGrid3D(N);
    // Vertical axis segment along j from 4..14 at (i=10,k=10).
    rasterCylinder(g, [10, 4, 10], [10, 14, 10], 2, 55);
    // Midpoint of the axis, on-axis: fixed.
    expect(g.fixed[idx3(10, 9, 10, N)]).toBe(1);
    expect(g.Vfix[idx3(10, 9, 10, N)]).toBe(55);
    // Radially far from the axis: untouched.
    expect(g.fixed[idx3(10, 9, 17, N)]).toBe(0);
    // Beyond the segment's endpoints (t out of [0,1]): untouched.
    expect(g.fixed[idx3(10, 1, 10, N)]).toBe(0);
  });

  it("degenerate a===b (lenSq < 1e-6) delegates to rasterSphere", () => {
    const gCyl = createGrid3D(N);
    const gSphere = createGrid3D(N);
    const point: [number, number, number] = [10, 10, 10];
    rasterCylinder(gCyl, point, point, 3, 77);
    rasterSphere(gSphere, point, 3, 77);
    expect(gCyl.fixed).toEqual(gSphere.fixed);
    expect(gCyl.Vfix).toEqual(gSphere.Vfix);
    expect(gCyl.V).toEqual(gSphere.V);
  });

  it("near-degenerate a≈b (distance below sqrt(1e-6)) also delegates to a sphere blob", () => {
    const g = createGrid3D(N);
    rasterCylinder(g, [10, 10, 10], [10.0005, 10, 10], 2, 33);
    // Should still produce a blob around the point, not a zero-length no-op.
    expect(g.fixed[idx3(10, 10, 10, N)]).toBe(1);
    expect(g.fixed[idx3(11, 10, 10, N)]).toBe(1);
  });
});

describe("rasterWire", () => {
  it("produces the same cells as an equal-radius rasterCylinder", () => {
    const gWire = createGrid3D(N);
    const gCyl = createGrid3D(N);
    rasterWire(gWire, [10, 4, 10], [10, 14, 10], 2, 55);
    rasterCylinder(gCyl, [10, 4, 10], [10, 14, 10], 2, 55);
    expect(gWire.fixed).toEqual(gCyl.fixed);
    expect(gWire.Vfix).toEqual(gCyl.Vfix);
    expect(gWire.V).toEqual(gCyl.V);
  });
});

describe("applyPrimitive3D", () => {
  it("dispatches 'wire' to rasterWire", () => {
    const g = createGrid3D(N);
    const prim: Primitive3D = {
      kind: "wire",
      a: [10, 4, 10],
      b: [10, 14, 10],
      thickness: 2,
      voltage: 11,
    };
    applyPrimitive3D(g, prim);
    expect(g.fixed[idx3(10, 9, 10, N)]).toBe(1);
    expect(g.Vfix[idx3(10, 9, 10, N)]).toBe(11);
    applyPrimitive3D(g, prim, true);
    expect(g.fixed[idx3(10, 9, 10, N)]).toBe(0);
  });

  it("dispatches 'plate' to rasterPlate", () => {
    const g = createGrid3D(N);
    const prim: Primitive3D = {
      kind: "plate",
      a: [4, 4, 4],
      b: [10, 10, 10],
      voltage: 22,
    };
    applyPrimitive3D(g, prim);
    expect(g.fixed[idx3(7, 7, 7, N)]).toBe(1);
    expect(g.Vfix[idx3(7, 7, 7, N)]).toBe(22);
    applyPrimitive3D(g, prim, true);
    expect(g.fixed[idx3(7, 7, 7, N)]).toBe(0);
  });

  it("dispatches 'sphere' to rasterSphere", () => {
    const g = createGrid3D(N);
    const prim: Primitive3D = {
      kind: "sphere",
      center: [10, 10, 10],
      radius: 3,
      voltage: 33,
    };
    applyPrimitive3D(g, prim);
    expect(g.fixed[idx3(10, 10, 10, N)]).toBe(1);
    expect(g.Vfix[idx3(10, 10, 10, N)]).toBe(33);
    applyPrimitive3D(g, prim, true);
    expect(g.fixed[idx3(10, 10, 10, N)]).toBe(0);
  });

  it("dispatches 'cylinder' to rasterCylinder", () => {
    const g = createGrid3D(N);
    const prim: Primitive3D = {
      kind: "cylinder",
      a: [10, 4, 10],
      b: [10, 14, 10],
      radius: 2,
      voltage: 44,
    };
    applyPrimitive3D(g, prim);
    expect(g.fixed[idx3(10, 9, 10, N)]).toBe(1);
    expect(g.Vfix[idx3(10, 9, 10, N)]).toBe(44);
    applyPrimitive3D(g, prim, true);
    expect(g.fixed[idx3(10, 9, 10, N)]).toBe(0);
  });
});
