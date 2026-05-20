export type Tool = "pos" | "neg" | "gnd" | "era";

export type BoundaryCondition = "dirichlet" | "neumann";

export interface GridState {
  N: number;
  V: Float32Array;
  fixed: Uint8Array;
  Vfix: Float32Array;
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

export interface SavedGeometry {
  name: string;
  N: number;
  cells: Array<[number, number, number]>;
  createdAt: number;
}

export interface DisplayFlags {
  heatmap: boolean;
  equipotentials: boolean;
  arrows: boolean;
}
