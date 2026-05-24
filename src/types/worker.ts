import type { AcConfig, BoundaryCondition, SolverConfig } from "@/types";

export type WorkerInbound =
  | {
      type: "init";
      N: number;
      boundary: BoundaryCondition;
      fixed: Uint8Array;
      Vfix: Float32Array;
      phase: Float32Array;
    }
  | { type: "run"; config: SolverConfig }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "step"; omega: number; count: number }
  | {
      type: "updateFixed";
      fixed: Uint8Array;
      Vfix: Float32Array;
      phase: Float32Array;
    }
  | { type: "setAC"; ac: AcConfig };

export type WorkerOutbound =
  | {
      type: "progress";
      iteration: number;
      deltaMax: number;
      V: Float32Array;
      // Accumulated AC phase in radians (only advances while running).
      acPhaseRad: number;
    }
  | {
      type: "done";
      iteration: number;
      deltaMax: number;
      converged: boolean;
      V: Float32Array;
      acPhaseRad: number;
    };
