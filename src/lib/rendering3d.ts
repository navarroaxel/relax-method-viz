import { divergentColor } from "@/lib/colormap";
import { idx3 } from "@/lib/grid3d";
import type { Grid3DState, SliceAxis } from "@/types/grid3d";

// Read a 2D slice of the V field perpendicular to `axis` at integer `index`.
// Output layout is (u, v) with N² elements, where u and v are the in-plane
// coordinates: axis=x → (j, k); axis=y → (i, k); axis=z → (i, j).
// Caller writes into `out` if provided to avoid allocations on each tick.
export function sampleSlice(
  grid: Grid3DState,
  axis: SliceAxis,
  index: number,
  out?: Float32Array,
): Float32Array {
  const { V, N } = grid;
  const dst = out && out.length === N * N ? out : new Float32Array(N * N);
  const clamped = Math.max(0, Math.min(N - 1, index | 0));
  if (axis === "x") {
    for (let j = 0; j < N; j++)
      for (let k = 0; k < N; k++)
        dst[j * N + k] = V[idx3(clamped, j, k, N)] as number;
  } else if (axis === "y") {
    for (let i = 0; i < N; i++)
      for (let k = 0; k < N; k++)
        dst[i * N + k] = V[idx3(i, clamped, k, N)] as number;
  } else {
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++)
        dst[i * N + j] = V[idx3(i, j, clamped, N)] as number;
  }
  return dst;
}

// Fill an existing RGBA Uint8ClampedArray with the divergent colormap of a
// slice. Length must be 4·N². Used as the source for a CanvasTexture.
export function paintSliceRGBA(
  slice: Float32Array,
  N: number,
  vmax: number,
  rgba: Uint8ClampedArray,
): void {
  for (let u = 0; u < N; u++) {
    for (let v = 0; v < N; v++) {
      const val = slice[u * N + v] as number;
      const [r, g, b] = divergentColor(val, vmax);
      const o = ((N - 1 - v) * N + u) * 4;
      rgba[o] = r;
      rgba[o + 1] = g;
      rgba[o + 2] = b;
      rgba[o + 3] = 255;
    }
  }
}

export function computeVmax3D(V: Float32Array): number {
  let m = 0;
  for (let i = 0; i < V.length; i++) {
    const a = Math.abs(V[i] as number);
    if (a > m) m = a;
  }
  return m;
}

// Marching squares on an N×N slice. Returns a flat Float32Array of segment
// endpoints in slice-local coords on a 1×1 plane centered at the origin
// ([x, y] ∈ [−0.5, +0.5]², z=0). Every 2 vertices is one segment, ready for
// THREE.LineSegments. Slice layout: slice[u * N + v] with u, v ∈ [0, N).
export function computeSliceContours(
  slice: Float32Array,
  N: number,
  vmax: number,
  numLevels = 13,
): Float32Array {
  if (vmax <= 0 || !Number.isFinite(vmax)) return new Float32Array();
  const levels: number[] = [];
  for (let k = 1; k <= numLevels; k++) {
    const t = (2 * k) / (numLevels + 1) - 1;
    if (Math.abs(t) < 1e-6) continue;
    levels.push(t * vmax);
  }
  const out: number[] = [];
  for (const L of levels) addLevelSegments(out, slice, N, L);
  const dst = new Float32Array(out.length * 1.5);
  // Pack as triples [x, y, 0] so the same buffer feeds a 3-component
  // position attribute directly.
  let w = 0;
  for (let r = 0; r < out.length; r += 2) {
    dst[w++] = out[r] as number;
    dst[w++] = out[r + 1] as number;
    dst[w++] = 0;
  }
  return dst.subarray(0, w);
}

// 3D streamline tracer: integrates polylines through E = −∇V by RK2 and
// returns a flat Float32Array of segment endpoints in world coords (the
// 1×1×1 cube centered at origin). Consumers feed it directly to a
// THREE.LineSegments geometry — every 6 floats = one segment.
export function computeStreamlines3D(
  grid: Grid3DState,
  opts: {
    seedStep?: number;
    h?: number;
    maxSteps?: number;
    minMag?: number;
  } = {},
): Float32Array {
  const N = grid.N;
  const seedStep = opts.seedStep ?? 8;
  const h = opts.h ?? 0.6; // step in voxel units per RK2 advance
  const maxSteps = opts.maxSteps ?? 3 * N;
  const minMag = opts.minMag ?? 1e-7;
  const { V, fixed } = grid;

  const N2 = N * N;
  const idxOf = (i: number, j: number, k: number): number =>
    (i * N + j) * N + k;

  const sampleE = (
    fx: number,
    fy: number,
    fz: number,
  ): [number, number, number, number] => {
    // Centered finite difference at the nearest interior voxel.
    const i = Math.max(1, Math.min(N - 2, Math.floor(fx)));
    const j = Math.max(1, Math.min(N - 2, Math.floor(fy)));
    const k = Math.max(1, Math.min(N - 2, Math.floor(fz)));
    const c = idxOf(i, j, k);
    const ex = -((V[c + N2] as number) - (V[c - N2] as number)) * 0.5;
    const ey = -((V[c + N] as number) - (V[c - N] as number)) * 0.5;
    const ez = -((V[c + 1] as number) - (V[c - 1] as number)) * 0.5;
    const mag = Math.sqrt(ex * ex + ey * ey + ez * ez);
    return [ex, ey, ez, mag];
  };

  const inside = (x: number, y: number, z: number): boolean =>
    x > 0.5 && x < N - 1.5 && y > 0.5 && y < N - 1.5 && z > 0.5 && z < N - 1.5;

  const isFixedAt = (x: number, y: number, z: number): boolean => {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const k = Math.floor(z);
    if (i < 0 || i >= N || j < 0 || j >= N || k < 0 || k >= N) return false;
    return fixed[idxOf(i, j, k)] === 1;
  };

  const w = (g: number): number => g / N - 0.5;
  const out: number[] = [];

  const trace = (x0: number, y0: number, z0: number, dir: 1 | -1): void => {
    let x = x0,
      y = y0,
      z = z0;
    for (let s = 0; s < maxSteps; s++) {
      const k1 = sampleE(x, y, z);
      if (k1[3] < minMag) break;
      const nx1 = k1[0] / k1[3];
      const ny1 = k1[1] / k1[3];
      const nz1 = k1[2] / k1[3];
      const k2 = sampleE(
        x + 0.5 * h * dir * nx1,
        y + 0.5 * h * dir * ny1,
        z + 0.5 * h * dir * nz1,
      );
      if (k2[3] < minMag) break;
      const nx2 = k2[0] / k2[3];
      const ny2 = k2[1] / k2[3];
      const nz2 = k2[2] / k2[3];
      const nx = x + h * dir * nx2;
      const ny = y + h * dir * ny2;
      const nz = z + h * dir * nz2;
      if (!inside(nx, ny, nz)) break;
      if (isFixedAt(nx, ny, nz)) break;
      out.push(w(x), w(y), w(z));
      out.push(w(nx), w(ny), w(nz));
      x = nx;
      y = ny;
      z = nz;
    }
  };

  const start = Math.max(2, Math.floor(seedStep / 2));
  for (let si = start; si < N - 1; si += seedStep) {
    for (let sj = start; sj < N - 1; sj += seedStep) {
      for (let sk = start; sk < N - 1; sk += seedStep) {
        if (fixed[idxOf(si, sj, sk)] === 1) continue;
        const x = si + 0.5;
        const y = sj + 0.5;
        const z = sk + 0.5;
        trace(x, y, z, +1);
        trace(x, y, z, -1);
      }
    }
  }
  return new Float32Array(out);
}

function addLevelSegments(
  out: number[],
  slice: Float32Array,
  N: number,
  L: number,
): void {
  const step = 1 / (N - 1);
  for (let i = 0; i < N - 1; i++) {
    for (let j = 0; j < N - 1; j++) {
      const vA = slice[i * N + j] as number;
      const vB = slice[(i + 1) * N + j] as number;
      const vC = slice[(i + 1) * N + (j + 1)] as number;
      const vD = slice[i * N + (j + 1)] as number;
      let c = 0;
      if (vA > L) c |= 1;
      if (vB > L) c |= 2;
      if (vC > L) c |= 4;
      if (vD > L) c |= 8;
      if (c === 0 || c === 15) continue;
      const ax = i * step - 0.5;
      const ay = j * step - 0.5;
      const bx = (i + 1) * step - 0.5;
      const by = j * step - 0.5;
      const cx = (i + 1) * step - 0.5;
      const cy = (j + 1) * step - 0.5;
      const dx = i * step - 0.5;
      const dy = (j + 1) * step - 0.5;
      const interp = (
        va: number,
        vb: number,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
      ): [number, number] => {
        const denom = va - vb;
        const t = denom === 0 ? 0.5 : (va - L) / denom;
        return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
      };
      const e0 = () => interp(vA, vB, ax, ay, bx, by);
      const e1 = () => interp(vB, vC, bx, by, cx, cy);
      const e2 = () => interp(vC, vD, cx, cy, dx, dy);
      const e3 = () => interp(vD, vA, dx, dy, ax, ay);
      const seg = (a: [number, number], b: [number, number]) =>
        out.push(a[0], a[1], b[0], b[1]);
      switch (c) {
        case 1:
        case 14:
          seg(e3(), e0());
          break;
        case 2:
        case 13:
          seg(e0(), e1());
          break;
        case 4:
        case 11:
          seg(e1(), e2());
          break;
        case 8:
        case 7:
          seg(e2(), e3());
          break;
        case 3:
        case 12:
          seg(e3(), e1());
          break;
        case 6:
        case 9:
          seg(e0(), e2());
          break;
        case 5: {
          const mean = (vA + vB + vC + vD) * 0.25;
          if (mean > L) {
            seg(e0(), e1());
            seg(e2(), e3());
          } else {
            seg(e3(), e0());
            seg(e1(), e2());
          }
          break;
        }
        case 10: {
          const mean = (vA + vB + vC + vD) * 0.25;
          if (mean > L) {
            seg(e3(), e0());
            seg(e1(), e2());
          } else {
            seg(e0(), e1());
            seg(e2(), e3());
          }
          break;
        }
      }
    }
  }
}
