import { clearAll3D } from "@/lib/grid3d";
import { rasterCylinder, rasterPlate } from "@/lib/primitives3d";
import type { Grid3DState } from "@/types/grid3d";

export type Preset3DId =
  | "parallel"
  | "dipole"
  | "coax"
  | "concentric"
  | "lightning"
  | "faraday"
  | "subconductors";

interface Preset3D {
  id: Preset3DId;
  labelKey:
    | "preset3d.parallel"
    | "preset3d.dipole"
    | "preset3d.coax"
    | "preset3d.concentric"
    | "preset3d.lightning"
    | "preset3d.faraday"
    | "preset3d.subconductors";
  apply: (g: Grid3DState) => void;
}

// All preset coordinates are written for N=60 and rescaled for any N.
const REF_N = 60;
const sc = (x: number, N: number) => Math.round((x * N) / REF_N);

export const PRESETS_3D: Record<Preset3DId, Preset3D> = {
  parallel: {
    id: "parallel",
    labelKey: "preset3d.parallel",
    apply: (g) => {
      clearAll3D(g);
      const N = g.N;
      // Two horizontal slabs at +100 / -100 V, spanning most of the X/Z
      // domain. Plates are perpendicular to the Y axis (vertical).
      const i0 = sc(8, N), i1 = sc(52, N);
      const k0 = sc(8, N), k1 = sc(52, N);
      const yTop = sc(45, N);
      const yBot = sc(15, N);
      const halfT = sc(2, N);
      rasterPlate(g, [i0, yTop - halfT, k0], [i1, yTop + halfT, k1], 100);
      rasterPlate(g, [i0, yBot - halfT, k0], [i1, yBot + halfT, k1], -100);
    },
  },
  dipole: {
    id: "dipole",
    labelKey: "preset3d.dipole",
    apply: (g) => {
      clearAll3D(g);
      // Two small slabs (acting as point-like sources) on opposite sides.
      const N = g.N;
      const half = sc(2, N);
      const cy = Math.floor(N / 2);
      const cz = Math.floor(N / 2);
      const left = sc(15, N);
      const right = sc(45, N);
      rasterPlate(
        g,
        [left - half, cy - half, cz - half],
        [left + half, cy + half, cz + half],
        100,
      );
      rasterPlate(
        g,
        [right - half, cy - half, cz - half],
        [right + half, cy + half, cz + half],
        -100,
      );
    },
  },
  coax: {
    id: "coax",
    labelKey: "preset3d.coax",
    apply: (g) => {
      clearAll3D(g);
      // Real coaxial cable, idealized as infinite along Z: both conductors
      // run the full Z extent of the domain. Without this, the erase pass
      // (which hollows out the shell) leaves the tube open at its ends and
      // field lines fringe out through the exposed dielectric. Extending
      // to the boundary cells lets the Neumann BC mirror back inward, so
      // the configuration looks z-translationally invariant — no end caps.
      //   inner conductor radius  : 3 voxels      → core wire
      //   dielectric gap          : 16 voxels     → insulator
      //   outer shell inner radius: 19 voxels
      //   outer shell outer radius: 23 voxels     → 4-voxel-thick shield
      const N = g.N;
      const cx = Math.floor(N / 2);
      const cy = Math.floor(N / 2);
      const rInner = sc(3, N);
      const rShellIn = sc(19, N);
      const rShellOut = sc(23, N);

      // Endpoints at 0 / N-1: paintVoxel skips boundary cells, but the
      // wider axis makes the t-parameter include z=N-2 (the last interior
      // layer). Without this the shell has a 1-cell z-gap and field leaks.
      rasterCylinder(g, [cx, cy, 0], [cx, cy, N - 1], rInner, 80);
      rasterCylinder(g, [cx, cy, 0], [cx, cy, N - 1], rShellOut, 0);
      rasterCylinder(g, [cx, cy, 0], [cx, cy, N - 1], rShellIn, 0, true);
      rasterCylinder(g, [cx, cy, 0], [cx, cy, N - 1], rInner, 80);
    },
  },
  concentric: {
    id: "concentric",
    labelKey: "preset3d.concentric",
    apply: (g) => {
      clearAll3D(g);
      const N = g.N;
      const cx = Math.floor(N / 2);
      const cy = Math.floor(N / 2);
      const rInner = sc(6, N);
      const rNeutral = sc(13, N);
      const rWire = Math.max(1, sc(1, N));
      const N_WIRES = 12;
      // Fase interior (+220 V), a lo largo de todo Z.
      rasterCylinder(g, [cx, cy, 0], [cx, cy, N - 1], rInner, 220);
      // Neutro concéntrico: hilos discretos a 0 V, cada uno un cilindro fino.
      for (let m = 0; m < N_WIRES; m++) {
        const th = (2 * Math.PI * m) / N_WIRES;
        const wx = Math.round(cx + rNeutral * Math.cos(th));
        const wy = Math.round(cy + rNeutral * Math.sin(th));
        rasterCylinder(g, [wx, wy, 0], [wx, wy, N - 1], rWire, 0);
      }
    },
  },
  lightning: {
    id: "lightning",
    labelKey: "preset3d.lightning",
    apply: (g) => {
      clearAll3D(g);
      // Simplified lightning rod:
      //   - "Cloud" : a high-V plate covering most of the top of the domain
      //   - "Earth" : a grounded plate covering the bottom
      //   - "Rod"   : a thin grounded cylinder rising from the earth plate,
      //               with a slightly tapered tip to encourage the
      //               characteristic edge concentration of |E|.
      const N = g.N;
      const xMin = sc(6, N);
      const xMax = sc(54, N);
      const zMin = sc(6, N);
      const zMax = sc(54, N);
      const yCloudBottom = sc(50, N);
      const yCloudTop = sc(54, N);
      const yEarthBottom = sc(6, N);
      const yEarthTop = sc(10, N);
      const cloudV = 100_000;

      // Cloud (top slab)
      rasterPlate(
        g,
        [xMin, yCloudBottom, zMin],
        [xMax, yCloudTop, zMax],
        cloudV,
      );
      // Earth (bottom slab, grounded)
      rasterPlate(g, [xMin, yEarthBottom, zMin], [xMax, yEarthTop, zMax], 0);

      // Lightning rod: a slender grounded cylinder rising from the earth
      // toward the cloud, plus a tiny tip cylinder on top to give the
      // pointy-edge concentration effect.
      const rodCx = Math.floor(N / 2);
      const rodCz = Math.floor(N / 2);
      const rodRadius = Math.max(1, sc(2, N));
      const tipRadius = Math.max(1, sc(1, N));
      const rodBaseY = yEarthTop;
      const rodTopY = sc(38, N);
      rasterCylinder(
        g,
        [rodCx, rodBaseY, rodCz],
        [rodCx, rodTopY, rodCz],
        rodRadius,
        0,
      );
      // Pointy tip — a shorter, thinner cylinder above the main rod.
      rasterCylinder(
        g,
        [rodCx, rodTopY, rodCz],
        [rodCx, rodTopY + sc(3, N), rodCz],
        tipRadius,
        0,
      );
    },
  },
  faraday: {
    id: "faraday",
    labelKey: "preset3d.faraday",
    apply: (g) => {
      clearAll3D(g);
      // Faraday cage: top source plate at +80 V, grounded bottom plate,
      // and a hollow grounded box (6 walls) between them. Inside the box
      // V → 0 — the cage screens the external field.
      const N = g.N;
      const xMin = sc(6, N);
      const xMax = sc(54, N);
      const zMin = sc(6, N);
      const zMax = sc(54, N);
      const yTopPlate = sc(52, N);
      const yTopPlateTop = sc(54, N);
      const yBotPlate = sc(6, N);
      const yBotPlateTop = sc(8, N);
      // Top source plate (+80 V).
      rasterPlate(
        g,
        [xMin, yTopPlate, zMin],
        [xMax, yTopPlateTop, zMax],
        80,
      );
      // Ground plate (0 V).
      rasterPlate(g, [xMin, yBotPlate, zMin], [xMax, yBotPlateTop, zMax], 0);

      // Hollow grounded box: paint a solid 0V box, then erase the interior.
      const bxMin = sc(18, N), bxMax = sc(42, N);
      const byMin = sc(20, N), byMax = sc(40, N);
      const bzMin = sc(18, N), bzMax = sc(42, N);
      rasterPlate(g, [bxMin, byMin, bzMin], [bxMax, byMax, bzMax], 0);
      // Carve interior, leaving voxel-thick walls (shrink each face by 2).
      rasterPlate(
        g,
        [bxMin + 2, byMin + 2, bzMin + 2],
        [bxMax - 2, byMax - 2, bzMax - 2],
        0,
        true, // erase
      );
    },
  },
  subconductors: {
    id: "subconductors",
    labelKey: "preset3d.subconductors",
    apply: (g) => {
      clearAll3D(g);
      const N = g.N;
      const V1 = Math.sqrt(2 / 3) * 500_000;
      const r = sc(2, N);
      const cx = Math.floor(N / 2);
      const spread = sc(4, N);
      const bundleY = sc(20, N);
      rasterPlate(g, [sc(6, N), sc(50, N), sc(6, N)], [sc(54, N), sc(52, N), sc(54, N)], 0);
      rasterCylinder(g, [cx - spread, bundleY, 0], [cx - spread, bundleY, N - 1], r, V1);
      rasterCylinder(g, [cx + spread, bundleY, 0], [cx + spread, bundleY, N - 1], r, V1);
      rasterCylinder(g, [cx - spread, bundleY + 2 * spread, 0], [cx - spread, bundleY + 2 * spread, N - 1], r, V1);
      rasterCylinder(g, [cx + spread, bundleY + 2 * spread, 0], [cx + spread, bundleY + 2 * spread, N - 1], r, V1);
    },
  },
};

export function apply(id: Preset3DId, g: Grid3DState): void {
  PRESETS_3D[id].apply(g);
}
