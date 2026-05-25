import type { Solver3DConfig } from "@/types/grid3d";

export type Worker3DInbound =
  | {
      type: "init";
      N: number;
      fixed: Uint8Array;
      Vfix: Float32Array;
    }
  | { type: "run"; config: Solver3DConfig }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "step"; omega: number; count: number }
  | {
      type: "updateFixed";
      fixed: Uint8Array;
      Vfix: Float32Array;
    };

export type Worker3DOutbound =
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
