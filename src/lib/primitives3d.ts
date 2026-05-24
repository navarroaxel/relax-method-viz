import { idx3 } from "@/lib/grid3d";
import type { Grid3DState, Primitive3D } from "@/types/grid3d";

// Set or clear a single voxel. erase=true wipes the cell (fixed=0, Vfix=0).
function paintVoxel(
  grid: Grid3DState,
  i: number,
  j: number,
  k: number,
  voltage: number,
  erase: boolean,
): void {
  const N = grid.N;
  if (i < 0 || i >= N || j < 0 || j >= N || k < 0 || k >= N) return;
  // Don't mutate the boundary row/col/page — applyBoundary3D rewrites them
  // each sweep and would overwrite a fixed value there.
  if (
    i === 0 ||
    i === N - 1 ||
    j === 0 ||
    j === N - 1 ||
    k === 0 ||
    k === N - 1
  )
    return;
  const idx = idx3(i, j, k, N);
  if (erase) {
    grid.fixed[idx] = 0;
    grid.Vfix[idx] = 0;
    grid.V[idx] = 0;
  } else {
    grid.fixed[idx] = 1;
    grid.Vfix[idx] = voltage;
    grid.V[idx] = voltage;
  }
}

// Fill an axis-aligned box [a, b] inclusive in voxel coordinates.
export function rasterPlate(
  grid: Grid3DState,
  a: [number, number, number],
  b: [number, number, number],
  voltage: number,
  erase = false,
): void {
  const i0 = Math.min(a[0], b[0]) | 0;
  const i1 = Math.max(a[0], b[0]) | 0;
  const j0 = Math.min(a[1], b[1]) | 0;
  const j1 = Math.max(a[1], b[1]) | 0;
  const k0 = Math.min(a[2], b[2]) | 0;
  const k1 = Math.max(a[2], b[2]) | 0;
  for (let i = i0; i <= i1; i++)
    for (let j = j0; j <= j1; j++)
      for (let k = k0; k <= k1; k++) paintVoxel(grid, i, j, k, voltage, erase);
}

// Fill a sphere (radius in voxels) centered at `center`.
export function rasterSphere(
  grid: Grid3DState,
  center: [number, number, number],
  radius: number,
  voltage: number,
  erase = false,
): void {
  const r = Math.max(0.5, radius);
  const r2 = r * r;
  const ci = center[0];
  const cj = center[1];
  const ck = center[2];
  const i0 = Math.floor(ci - r);
  const i1 = Math.ceil(ci + r);
  const j0 = Math.floor(cj - r);
  const j1 = Math.ceil(cj + r);
  const k0 = Math.floor(ck - r);
  const k1 = Math.ceil(ck + r);
  for (let i = i0; i <= i1; i++) {
    const di = i + 0.5 - ci;
    for (let j = j0; j <= j1; j++) {
      const dj = j + 0.5 - cj;
      for (let k = k0; k <= k1; k++) {
        const dk = k + 0.5 - ck;
        if (di * di + dj * dj + dk * dk <= r2)
          paintVoxel(grid, i, j, k, voltage, erase);
      }
    }
  }
}

// Finite cylinder between `a` and `b` (centers of the end caps), radius
// perpendicular to the axis. Includes the end caps (no hollow tube).
export function rasterCylinder(
  grid: Grid3DState,
  a: [number, number, number],
  b: [number, number, number],
  radius: number,
  voltage: number,
  erase = false,
): void {
  const r = Math.max(0.5, radius);
  const r2 = r * r;
  const axX = b[0] - a[0];
  const axY = b[1] - a[1];
  const axZ = b[2] - a[2];
  const lenSq = axX * axX + axY * axY + axZ * axZ;
  if (lenSq < 1e-6) {
    rasterSphere(grid, a, r, voltage, erase);
    return;
  }
  // Bounding box: expand the segment AABB by radius in every direction.
  const i0 = Math.floor(Math.min(a[0], b[0]) - r);
  const i1 = Math.ceil(Math.max(a[0], b[0]) + r);
  const j0 = Math.floor(Math.min(a[1], b[1]) - r);
  const j1 = Math.ceil(Math.max(a[1], b[1]) + r);
  const k0 = Math.floor(Math.min(a[2], b[2]) - r);
  const k1 = Math.ceil(Math.max(a[2], b[2]) + r);
  for (let i = i0; i <= i1; i++) {
    const px = i + 0.5 - a[0];
    for (let j = j0; j <= j1; j++) {
      const py = j + 0.5 - a[1];
      for (let k = k0; k <= k1; k++) {
        const pz = k + 0.5 - a[2];
        // Project P onto the axis. t in [0, 1] is inside the segment.
        const t = (px * axX + py * axY + pz * axZ) / lenSq;
        if (t < 0 || t > 1) continue;
        const qx = px - t * axX;
        const qy = py - t * axY;
        const qz = pz - t * axZ;
        if (qx * qx + qy * qy + qz * qz <= r2)
          paintVoxel(grid, i, j, k, voltage, erase);
      }
    }
  }
}

// Wire = a thin cylinder. Implemented in terms of rasterCylinder so we can
// keep the rasterization logic in one place.
export function rasterWire(
  grid: Grid3DState,
  a: [number, number, number],
  b: [number, number, number],
  thickness: number,
  voltage: number,
  erase = false,
): void {
  rasterCylinder(grid, a, b, Math.max(0.5, thickness), voltage, erase);
}

export function applyPrimitive3D(
  grid: Grid3DState,
  prim: Primitive3D,
  erase = false,
): void {
  switch (prim.kind) {
    case "wire":
      rasterWire(grid, prim.a, prim.b, prim.thickness, prim.voltage, erase);
      return;
    case "plate":
      rasterPlate(grid, prim.a, prim.b, prim.voltage, erase);
      return;
    case "sphere":
      rasterSphere(grid, prim.center, prim.radius, prim.voltage, erase);
      return;
    case "cylinder":
      rasterCylinder(grid, prim.a, prim.b, prim.radius, prim.voltage, erase);
      return;
  }
}
