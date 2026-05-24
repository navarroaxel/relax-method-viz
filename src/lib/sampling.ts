import { idx } from "@/lib/grid";
import type { GridState } from "@/types";

// Clamp index to valid grid range [0, N-1].
function clamp(i: number, N: number): number {
  if (i < 0) return 0;
  if (i > N - 1) return N - 1;
  return i;
}

// Read V at integer cell, clamped at the border.
function vCell(V: Float32Array, N: number, i: number, j: number): number {
  return V[idx(clamp(i, N), clamp(j, N), N)] as number;
}

// Bilinear interpolation of V at fractional grid coordinates (x = i, y = j).
// Out-of-range coordinates clamp to the nearest border cell.
export function sampleV(
  V: Float32Array,
  N: number,
  x: number,
  y: number,
): number {
  const i0 = Math.floor(x);
  const j0 = Math.floor(y);
  const fx = x - i0;
  const fy = y - j0;
  const v00 = vCell(V, N, i0, j0);
  const v10 = vCell(V, N, i0 + 1, j0);
  const v01 = vCell(V, N, i0, j0 + 1);
  const v11 = vCell(V, N, i0 + 1, j0 + 1);
  return (
    (1 - fx) * (1 - fy) * v00 +
    fx * (1 - fy) * v10 +
    (1 - fx) * fy * v01 +
    fx * fy * v11
  );
}

// Centered-difference E = -∇V at an integer cell (i, j). Border cells use
// one-sided differences via clamping (mirror), so E is finite everywhere.
function eCell(
  V: Float32Array,
  N: number,
  i: number,
  j: number,
): [number, number] {
  const vR = vCell(V, N, i + 1, j);
  const vL = vCell(V, N, i - 1, j);
  const vD = vCell(V, N, i, j + 1);
  const vU = vCell(V, N, i, j - 1);
  return [-(vR - vL) * 0.5, -(vD - vU) * 0.5];
}

// Bilinear interpolation of E at fractional grid coordinates.
// Unlike the streamline sampler, this never returns mag = 0 inside conductors —
// it returns whatever the centered-difference gives at that point. For a
// conductor strip this is exactly the discontinuity in V you want to see in a
// trace profile.
export function sampleE(
  V: Float32Array,
  N: number,
  x: number,
  y: number,
): { ex: number; ey: number; mag: number } {
  const i0 = Math.floor(x);
  const j0 = Math.floor(y);
  const fx = x - i0;
  const fy = y - j0;
  const e00 = eCell(V, N, i0, j0);
  const e10 = eCell(V, N, i0 + 1, j0);
  const e01 = eCell(V, N, i0, j0 + 1);
  const e11 = eCell(V, N, i0 + 1, j0 + 1);
  const w00 = (1 - fx) * (1 - fy);
  const w10 = fx * (1 - fy);
  const w01 = (1 - fx) * fy;
  const w11 = fx * fy;
  const ex =
    w00 * e00[0] + w10 * e10[0] + w01 * e01[0] + w11 * e11[0];
  const ey =
    w00 * e00[1] + w10 * e10[1] + w01 * e01[1] + w11 * e11[1];
  return { ex, ey, mag: Math.hypot(ex, ey) };
}

// Variant used by the streamline tracer: stops (returns mag = 0) when any of
// the four enclosing cells is a conductor or when (x, y) is too close to the
// outer border. Kept here so renderStreamlines and the trace sampler share the
// same bilinear arithmetic.
export function sampleEForStreamline(
  V: Float32Array,
  fixed: Uint8Array,
  N: number,
  x: number,
  y: number,
): { ex: number; ey: number; mag: number } {
  const i0 = Math.floor(x);
  const j0 = Math.floor(y);
  if (i0 < 1 || j0 < 1 || i0 >= N - 2 || j0 >= N - 2)
    return { ex: 0, ey: 0, mag: 0 };
  const fx = x - i0;
  const fy = y - j0;
  const corner = (ii: number, jj: number): [number, number] | null => {
    if ((fixed[idx(ii, jj, N)] as number) === 1) return null;
    const vR = V[idx(ii + 1, jj, N)] as number;
    const vL = V[idx(ii - 1, jj, N)] as number;
    const vD = V[idx(ii, jj + 1, N)] as number;
    const vU = V[idx(ii, jj - 1, N)] as number;
    return [-(vR - vL) * 0.5, -(vD - vU) * 0.5];
  };
  const c00 = corner(i0, j0);
  const c10 = corner(i0 + 1, j0);
  const c01 = corner(i0, j0 + 1);
  const c11 = corner(i0 + 1, j0 + 1);
  if (!c00 || !c10 || !c01 || !c11) return { ex: 0, ey: 0, mag: 0 };
  const w00 = (1 - fx) * (1 - fy);
  const w10 = fx * (1 - fy);
  const w01 = (1 - fx) * fy;
  const w11 = fx * fy;
  const ex = w00 * c00[0] + w10 * c10[0] + w01 * c01[0] + w11 * c11[0];
  const ey = w00 * c00[1] + w10 * c10[1] + w01 * c01[1] + w11 * c11[1];
  return { ex, ey, mag: Math.hypot(ex, ey) };
}

export interface TraceSamples {
  s: Float32Array;
  V: Float32Array;
  E: Float32Array;
  sMax: number;
}

// Walk a polyline (points in grid units, fractional allowed) with uniform
// arc-length step `ds` and sample V and |E| at every step.
export function sampleTrace(
  grid: GridState,
  points: ReadonlyArray<readonly [number, number]>,
  ds: number,
): TraceSamples | null {
  if (points.length < 2 || ds <= 0) return null;

  const segLengths: number[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as readonly [number, number];
    const b = points[i] as readonly [number, number];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segLengths.push(len);
    total += len;
  }
  if (total <= 0) return null;

  const count = Math.max(2, Math.floor(total / ds) + 1);
  const stepLen = total / (count - 1);

  const sArr = new Float32Array(count);
  const vArr = new Float32Array(count);
  const eArr = new Float32Array(count);

  let segIdx = 0;
  let segStart = 0;
  for (let k = 0; k < count; k++) {
    const target = k * stepLen;
    while (
      segIdx < segLengths.length - 1 &&
      target > segStart + (segLengths[segIdx] as number)
    ) {
      segStart += segLengths[segIdx] as number;
      segIdx++;
    }
    const segLen = segLengths[segIdx] as number;
    const local = segLen > 0 ? (target - segStart) / segLen : 0;
    const a = points[segIdx] as readonly [number, number];
    const b = points[segIdx + 1] as readonly [number, number];
    const x = a[0] + local * (b[0] - a[0]);
    const y = a[1] + local * (b[1] - a[1]);
    sArr[k] = target;
    vArr[k] = sampleV(grid.V, grid.N, x, y);
    eArr[k] = sampleE(grid.V, grid.N, x, y).mag;
  }

  return { s: sArr, V: vArr, E: eArr, sMax: total };
}
