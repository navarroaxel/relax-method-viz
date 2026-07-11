import { describe, expect, it } from "vitest";
import {
  computeSliceContours,
  computeStreamlines3D,
  computeVmax3D,
  paintSliceRGBA,
  sampleSlice,
} from "@/lib/rendering3d";
import { divergentColor } from "@/lib/colormap";
import { createGrid3D, idx3 } from "@/lib/grid3d";
import type { Grid3DState } from "@/types/grid3d";

describe("computeVmax3D", () => {
  it("returns the max absolute value", () => {
    const V = new Float32Array([1, -5, 3, -2]);
    expect(computeVmax3D(V)).toBeCloseTo(5, 5);
  });

  it("returns 0 for an all-zero array", () => {
    const V = new Float32Array(10);
    expect(computeVmax3D(V)).toBe(0);
  });
});

describe("sampleSlice", () => {
  function makeFilledGrid(N: number): Grid3DState {
    const grid = createGrid3D(N);
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        for (let k = 0; k < N; k++) {
          // Distinct value per axis so we can verify plane extraction.
          grid.V[idx3(i, j, k, N)] = i * 100 + j * 10 + k;
        }
      }
    }
    return grid;
  }

  it("extracts the correct plane for axis=x: dst[j*N+k] = V[fixed i, j, k]", () => {
    const N = 6;
    const grid = makeFilledGrid(N);
    const fixedI = 3;
    const slice = sampleSlice(grid, "x", fixedI);
    for (let j = 0; j < N; j++) {
      for (let k = 0; k < N; k++) {
        expect(slice[j * N + k]).toBeCloseTo(fixedI * 100 + j * 10 + k, 5);
      }
    }
  });

  it("extracts the correct plane for axis=y: dst[i*N+k] = V[i, fixed j, k]", () => {
    const N = 6;
    const grid = makeFilledGrid(N);
    const fixedJ = 2;
    const slice = sampleSlice(grid, "y", fixedJ);
    for (let i = 0; i < N; i++) {
      for (let k = 0; k < N; k++) {
        expect(slice[i * N + k]).toBeCloseTo(i * 100 + fixedJ * 10 + k, 5);
      }
    }
  });

  it("extracts the correct plane for axis=z: dst[i*N+j] = V[i, j, fixed k]", () => {
    const N = 6;
    const grid = makeFilledGrid(N);
    const fixedK = 4;
    const slice = sampleSlice(grid, "z", fixedK);
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        expect(slice[i * N + j]).toBeCloseTo(i * 100 + j * 10 + fixedK, 5);
      }
    }
  });

  it("clamps an out-of-range index into [0, N-1]", () => {
    const N = 6;
    const grid = makeFilledGrid(N);
    const sliceHigh = sampleSlice(grid, "z", 999);
    const sliceAtMax = sampleSlice(grid, "z", N - 1);
    expect(sliceHigh).toEqual(sliceAtMax);

    const sliceLow = sampleSlice(grid, "z", -50);
    const sliceAtZero = sampleSlice(grid, "z", 0);
    expect(sliceLow).toEqual(sliceAtZero);
  });

  it("reuses the provided out buffer when correctly sized", () => {
    const N = 6;
    const grid = makeFilledGrid(N);
    const out = new Float32Array(N * N);
    const result = sampleSlice(grid, "z", 0, out);
    expect(result).toBe(out);
  });

  it("allocates a new buffer when out is missing or wrongly sized", () => {
    const N = 6;
    const grid = makeFilledGrid(N);
    const wrongSized = new Float32Array(3);
    const result = sampleSlice(grid, "z", 0, wrongSized);
    expect(result).not.toBe(wrongSized);
    expect(result.length).toBe(N * N);
  });
});

describe("paintSliceRGBA", () => {
  it("fills an RGBA buffer of length 4*N*N matching divergentColor at each cell", () => {
    const N = 4;
    const vmax = 10;
    const slice = new Float32Array(N * N);
    slice[0 * N + 0] = 0; // white
    slice[1 * N + 1] = vmax; // red
    slice[2 * N + 2] = -vmax; // blue

    const rgba = new Uint8ClampedArray(4 * N * N);
    paintSliceRGBA(slice, N, vmax, rgba);
    expect(rgba.length).toBe(4 * N * N);

    // u=0, v=0 -> o = ((N-1-0)*N + 0)*4
    const oWhite = ((N - 1 - 0) * N + 0) * 4;
    const white = divergentColor(0, vmax);
    expect(rgba[oWhite]).toBe(white[0]);
    expect(rgba[oWhite + 1]).toBe(white[1]);
    expect(rgba[oWhite + 2]).toBe(white[2]);
    expect(rgba[oWhite + 3]).toBe(255);

    // u=1, v=1 -> o = ((N-1-1)*N + 1)*4
    const oRed = ((N - 1 - 1) * N + 1) * 4;
    const red = divergentColor(vmax, vmax);
    expect(rgba[oRed]).toBe(red[0]);
    expect(rgba[oRed + 1]).toBe(red[1]);
    expect(rgba[oRed + 2]).toBe(red[2]);

    // u=2, v=2 -> o = ((N-1-2)*N + 2)*4
    const oBlue = ((N - 1 - 2) * N + 2) * 4;
    const blue = divergentColor(-vmax, vmax);
    expect(rgba[oBlue]).toBe(blue[0]);
    expect(rgba[oBlue + 1]).toBe(blue[1]);
    expect(rgba[oBlue + 2]).toBe(blue[2]);
  });
});

describe("computeSliceContours", () => {
  it("returns an empty array when vmax <= 0", () => {
    const N = 8;
    const slice = new Float32Array(N * N);
    expect(computeSliceContours(slice, N, 0).length).toBe(0);
    expect(computeSliceContours(slice, N, -5).length).toBe(0);
  });

  it("returns an empty array when vmax is non-finite", () => {
    const N = 8;
    const slice = new Float32Array(N * N);
    expect(computeSliceContours(slice, N, Infinity).length).toBe(0);
    expect(computeSliceContours(slice, N, NaN).length).toBe(0);
  });

  it("returns a nonempty packed [x,y,0] array within unit-plane bounds for a linear gradient slice", () => {
    const N = 20;
    const vmax = 10;
    const slice = new Float32Array(N * N);
    // Linear ramp across i so many contour levels are crossed.
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        slice[i * N + j] = (i / (N - 1)) * 2 * vmax - vmax; // -vmax..+vmax
      }
    }
    const contours = computeSliceContours(slice, N, vmax);
    expect(contours.length).toBeGreaterThan(0);
    expect(contours.length % 3).toBe(0);
    for (let p = 0; p < contours.length; p += 3) {
      const x = contours[p] as number;
      const y = contours[p + 1] as number;
      const z = contours[p + 2] as number;
      expect(x).toBeGreaterThanOrEqual(-0.5001);
      expect(x).toBeLessThanOrEqual(0.5001);
      expect(y).toBeGreaterThanOrEqual(-0.5001);
      expect(y).toBeLessThanOrEqual(0.5001);
      expect(z).toBe(0);
    }
  });
});

describe("computeStreamlines3D", () => {
  it("returns a nonempty Float32Array for a field with a uniform gradient", () => {
    const N = 20;
    const grid = createGrid3D(N);
    // Linear potential along i: V = i (a uniform field in the x direction).
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        for (let k = 0; k < N; k++) {
          grid.V[idx3(i, j, k, N)] = i;
        }
      }
    }
    const lines = computeStreamlines3D(grid, { seedStep: 8 });
    expect(lines).toBeInstanceOf(Float32Array);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.length % 6).toBe(0);
  });

  it("returns empty (or near-empty) output for a completely flat field", () => {
    const N = 20;
    const grid = createGrid3D(N); // all zeros by construction
    const lines = computeStreamlines3D(grid, { seedStep: 8 });
    expect(lines.length).toBe(0);
  });
});
