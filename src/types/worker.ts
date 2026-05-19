import type { BoundaryCondition, SolverConfig } from "@/types";

export type WorkerInbound =
  | {
      type: "init";
      N: number;
      boundary: BoundaryCondition;
      fixed: Uint8Array;
      Vfix: Float32Array;
    }
  | { type: "run"; config: SolverConfig }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "step"; omega: number; count: number }
  | { type: "updateFixed"; fixed: Uint8Array; Vfix: Float32Array };

export type WorkerOutbound =
  | {
      type: "progress";
      iteration: number;
      deltaMax: number;
      V: Float32Array;
    }
  | {
      type: "done";
      iteration: number;
      deltaMax: number;
      converged: boolean;
      V: Float32Array;
    };
