// Three-dimensional voxel grid used by Simulator3D.
//
// Indexing convention: idx3(i, j, k, N) = (i * N + j) * N + k, i.e. the
// k axis varies fastest in memory. (i, j, k) maps to world space as
// i → x (rightward), j → y (up), k → z (toward camera).

export interface Grid3DState {
  N: number;
  V: Float32Array; // length N³
  fixed: Uint8Array; // length N³, 1 = conductor
  Vfix: Float32Array; // length N³, target potential for fixed cells
}

export interface Solver3DConfig {
  omega: number;
  tolerance: number;
  maxIterations: number;
  reportEvery: number;
}

// Anchored 3D shapes the user places with the primitive tools. Coordinates
// are in voxel units (floats are clamped/rounded when rasterized).
export type Primitive3D =
  | {
      kind: "wire";
      a: [number, number, number];
      b: [number, number, number];
      thickness: number; // voxel radius around the polyline
      voltage: number;
    }
  | {
      kind: "plate";
      a: [number, number, number]; // axis-aligned box, one corner
      b: [number, number, number]; // opposite corner
      voltage: number;
    }
  | {
      kind: "sphere";
      center: [number, number, number];
      radius: number;
      voltage: number;
    }
  | {
      kind: "cylinder";
      a: [number, number, number]; // base center
      b: [number, number, number]; // tip center
      radius: number;
      voltage: number;
    };

export type SliceAxis = "x" | "y" | "z";

export type Tool3D = "wire" | "plate" | "sphere" | "cylinder" | "era";
