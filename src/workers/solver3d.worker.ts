/// <reference lib="webworker" />

import { applyFixedValues3D } from "@/lib/grid3d";
import { relaxStep3D } from "@/lib/relaxation3d";
import type { Grid3DState } from "@/types/grid3d";
import type { Worker3DInbound, Worker3DOutbound } from "@/types/worker3d";

declare const self: DedicatedWorkerGlobalScope;

let grid: Grid3DState | null = null;
let running = false;
let iteration = 0;
let runToken = 0;

function snapshotV(g: Grid3DState): Float32Array {
  return new Float32Array(g.V);
}

function postOut(msg: Worker3DOutbound, transfer: Transferable[]): void {
  self.postMessage(msg, transfer);
}

function emitProgress(deltaMax: number): void {
  if (!grid) return;
  const snap = snapshotV(grid);
  postOut(
    { type: "progress", iteration, deltaMax, V: snap },
    [snap.buffer],
  );
}

function emitDone(deltaMax: number, converged: boolean): void {
  if (!grid) return;
  const snap = snapshotV(grid);
  postOut(
    { type: "done", iteration, deltaMax, converged, V: snap },
    [snap.buffer],
  );
}

function startRun(config: {
  omega: number;
  tolerance: number;
  maxIterations: number;
  reportEvery: number;
}): void {
  if (!grid) return;
  running = true;
  const myToken = ++runToken;

  const loop = () => {
    if (!running || myToken !== runToken || !grid) return;
    let deltaMax = 0;
    for (let s = 0; s < config.reportEvery; s++) {
      deltaMax = relaxStep3D(grid, config.omega);
      iteration++;
      if (deltaMax < config.tolerance) {
        running = false;
        emitDone(deltaMax, true);
        return;
      }
      if (iteration >= config.maxIterations) {
        running = false;
        emitDone(deltaMax, false);
        return;
      }
    }
    emitProgress(deltaMax);
    setTimeout(loop, 0);
  };

  setTimeout(loop, 0);
}

self.onmessage = (e: MessageEvent<Worker3DInbound>) => {
  const msg = e.data;
  switch (msg.type) {
    case "init": {
      const size = msg.N * msg.N * msg.N;
      grid = {
        N: msg.N,
        V: new Float32Array(size),
        fixed: msg.fixed,
        Vfix: msg.Vfix,
      };
      applyFixedValues3D(grid);
      iteration = 0;
      running = false;
      runToken++;
      break;
    }
    case "updateFixed": {
      if (!grid) break;
      grid.fixed = msg.fixed;
      grid.Vfix = msg.Vfix;
      applyFixedValues3D(grid);
      break;
    }
    case "run": {
      if (!grid || running) break;
      startRun(msg.config);
      break;
    }
    case "pause": {
      running = false;
      runToken++;
      break;
    }
    case "reset": {
      if (!grid) break;
      running = false;
      runToken++;
      grid.V.fill(0);
      iteration = 0;
      applyFixedValues3D(grid);
      emitProgress(Number.POSITIVE_INFINITY);
      break;
    }
    case "step": {
      if (!grid || running) break;
      let deltaMax = 0;
      for (let s = 0; s < msg.count; s++) {
        deltaMax = relaxStep3D(grid, msg.omega);
        iteration++;
      }
      emitProgress(deltaMax);
      break;
    }
  }
};
