import { describe, it, expect } from "vitest";
import { createGrid3D, idx3 } from "@/lib/grid3d";
import {
  PRESETS_3D,
  apply,
  type Preset3DId,
} from "@/lib/presets3d";

const SIZES = [40, 60, 80];
const PRESET_IDS = Object.keys(PRESETS_3D) as Preset3DId[];

describe("PRESETS_3D consistency", () => {
  it("each entry's id field matches its key", () => {
    for (const key of PRESET_IDS) {
      expect(PRESETS_3D[key].id).toBe(key);
    }
  });

  it("the dispatcher apply() delegates to PRESETS_3D[id].apply", () => {
    const N = 40;
    const gDirect = createGrid3D(N);
    const gViaApply = createGrid3D(N);
    PRESETS_3D.parallel.apply(gDirect);
    apply("parallel", gViaApply);
    expect(gViaApply.fixed).toEqual(gDirect.fixed);
    expect(gViaApply.Vfix).toEqual(gDirect.Vfix);
    expect(gViaApply.V).toEqual(gDirect.V);
  });
});

function fixedVoxels(
  g: ReturnType<typeof createGrid3D>,
): { i: number; j: number; k: number; idx: number }[] {
  const { N, fixed } = g;
  const out: { i: number; j: number; k: number; idx: number }[] = [];
  for (let idx = 0; idx < fixed.length; idx++) {
    if (fixed[idx] === 1) {
      const i = Math.floor(idx / (N * N));
      const rem = idx % (N * N);
      const j = Math.floor(rem / N);
      const k = rem % N;
      out.push({ i, j, k, idx });
    }
  }
  return out;
}

describe.each(PRESET_IDS)("preset3d %s", (id) => {
  it.each(SIZES)("has fixed voxels and all are in the interior [1,N-2]^3 (N=%i)", (N) => {
    const g = createGrid3D(N);
    PRESETS_3D[id].apply(g);
    const voxels = fixedVoxels(g);
    expect(voxels.length).toBeGreaterThan(0);
    const offenders = voxels.filter(
      (v) =>
        v.i < 1 ||
        v.i > N - 2 ||
        v.j < 1 ||
        v.j > N - 2 ||
        v.k < 1 ||
        v.k > N - 2,
    );
    expect(
      offenders,
      `preset3d "${id}" at N=${N} placed ${offenders.length} fixed voxel(s) on a boundary face: ${JSON.stringify(
        offenders.slice(0, 5),
      )}`,
    ).toEqual([]);
  });

  it.each(SIZES)("idx3 round-trip matches decode convention (N=%i)", (N) => {
    const g = createGrid3D(N);
    PRESETS_3D[id].apply(g);
    const voxels = fixedVoxels(g);
    // Spot-check a handful of voxels re-encode to the same linear index.
    for (const v of voxels.slice(0, 20)) {
      expect(idx3(v.i, v.j, v.k, N)).toBe(v.idx);
    }
  });
});

describe("preset3d-specific voltage checks", () => {
  it.each(SIZES)("parallel: has +100 and -100 fixed voxels (N=%i)", (N) => {
    const g = createGrid3D(N);
    PRESETS_3D.parallel.apply(g);
    const vals = new Set<number>();
    for (let k = 0; k < g.fixed.length; k++) {
      if (g.fixed[k] === 1) vals.add(g.Vfix[k] as number);
    }
    expect(vals.has(100)).toBe(true);
    expect(vals.has(-100)).toBe(true);
  });

  it.each(SIZES)("dipole: has +100 and -100 fixed voxels (N=%i)", (N) => {
    const g = createGrid3D(N);
    PRESETS_3D.dipole.apply(g);
    const vals = new Set<number>();
    for (let k = 0; k < g.fixed.length; k++) {
      if (g.fixed[k] === 1) vals.add(g.Vfix[k] as number);
    }
    expect(vals.has(100)).toBe(true);
    expect(vals.has(-100)).toBe(true);
  });

  it.each(SIZES)("coax: has a grounded (0V) outer shell and +80V inner conductor (N=%i)", (N) => {
    const g = createGrid3D(N);
    PRESETS_3D.coax.apply(g);
    const vals = new Set<number>();
    for (let k = 0; k < g.fixed.length; k++) {
      if (g.fixed[k] === 1) vals.add(g.Vfix[k] as number);
    }
    expect(vals.has(0)).toBe(true);
    expect(vals.has(80)).toBe(true);
  });

  it.each(SIZES)("lightning: has +100000 cloud plate and a grounded (0V) rod/earth (N=%i)", (N) => {
    const g = createGrid3D(N);
    PRESETS_3D.lightning.apply(g);
    const vals = new Set<number>();
    for (let k = 0; k < g.fixed.length; k++) {
      if (g.fixed[k] === 1) vals.add(g.Vfix[k] as number);
    }
    expect(vals.has(100_000)).toBe(true);
    expect(vals.has(0)).toBe(true);
  });

  it.each(SIZES)("faraday: has +80V source plate and grounded (0V) box (N=%i)", (N) => {
    const g = createGrid3D(N);
    PRESETS_3D.faraday.apply(g);
    const vals = new Set<number>();
    for (let k = 0; k < g.fixed.length; k++) {
      if (g.fixed[k] === 1) vals.add(g.Vfix[k] as number);
    }
    expect(vals.has(80)).toBe(true);
    expect(vals.has(0)).toBe(true);
  });

  it.each(SIZES)("faraday: box interior is hollow (erased) not fixed (N=%i)", (N) => {
    const g = createGrid3D(N);
    PRESETS_3D.faraday.apply(g);
    const sc = (x: number) => Math.round((x * N) / 60);
    const cx = sc(30);
    const cy = sc(30);
    const cz = sc(30);
    const idx = idx3(cx, cy, cz, N);
    expect(g.fixed[idx]).toBe(0);
  });

  it.each(SIZES)("subconductors: has cells at V1 = sqrt(2/3)*500000 and a grounded plate (N=%i)", (N) => {
    const g = createGrid3D(N);
    PRESETS_3D.subconductors.apply(g);
    const V1 = Math.sqrt(2 / 3) * 500_000;
    let foundV1 = false;
    let foundGround = false;
    for (let k = 0; k < g.fixed.length; k++) {
      if (g.fixed[k] !== 1) continue;
      const v = g.Vfix[k] as number;
      // Vfix is a Float32Array, so the stored double constant loses
      // precision (~0.05 absolute at this magnitude) — use a tolerance.
      if (Math.abs(v - V1) < 1) foundV1 = true;
      if (v === 0) foundGround = true;
    }
    expect(foundV1).toBe(true);
    expect(foundGround).toBe(true);
  });
});
