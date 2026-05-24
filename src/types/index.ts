export type Tool = "pos" | "neg" | "gnd" | "era" | "line" | "curve";

export type BoundaryCondition = "dirichlet" | "neumann";

export interface GridState {
  N: number;
  V: Float32Array;
  fixed: Uint8Array;
  Vfix: Float32Array;
  // Per-cell AC phase, in radians. Only meaningful for fixed cells when AC
  // modulation is enabled in the solver.
  phase: Float32Array;
  boundary: BoundaryCondition;
}

export interface SolverConfig {
  omega: number;
  tolerance: number;
  maxIterations: number;
  reportEvery: number;
}

export interface SolverProgress {
  iteration: number;
  deltaMax: number;
  converged: boolean;
}

// 3-tuple [i, j, V] is the legacy form; 4-tuple [i, j, V, phaseDeg] adds the
// AC phase in degrees. New code writes the 4-tuple; old saves still load.
export type SavedCell = [number, number, number] | [number, number, number, number];

export interface SavedGeometry {
  name: string;
  N: number;
  cells: SavedCell[];
  createdAt: number;
}

export interface DisplayFlags {
  heatmap: boolean;
  equipotentials: boolean;
  arrows: boolean;
  streamlines: boolean;
  surface3D: boolean;
}

export interface AcConfig {
  enabled: boolean;
  // Solver iterations per full cycle of sin().
  period: number;
}
