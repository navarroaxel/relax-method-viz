/// <reference lib="webworker" />

import { applyFixedValues } from "@/lib/grid";
import { relaxStep } from "@/lib/relaxation";
import type { GridState } from "@/types";
import type { WorkerInbound, WorkerOutbound } from "@/types/worker";

declare const self: DedicatedWorkerGlobalScope;

let grid: GridState | null = null;
let running = false;
let iteration = 0;
let runToken = 0;

function snapshotV(g: GridState): Float32Array {
  return new Float32Array(g.V);
}

function postOut(msg: WorkerOutbound, transfer: Transferable[]): void {
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

function startRun(config: { omega: number; tolerance: number; maxIterations: number; reportEvery: number }): void {
  if (!grid) return;
  running = true;
  const myToken = ++runToken;

  const loop = () => {
    if (!running || myToken !== runToken || !grid) return;
    let deltaMax = 0;
    for (let s = 0; s < config.reportEvery; s++) {
      deltaMax = relaxStep(grid, config.omega);
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
    // Yield so the inbound message queue (updateFixed, pause, ...) can drain
    // before the next batch.
    setTimeout(loop, 0);
  };

  setTimeout(loop, 0);
}

self.onmessage = (e: MessageEvent<WorkerInbound>) => {
  const msg = e.data;
  switch (msg.type) {
    case "init": {
      const size = msg.N * msg.N;
      grid = {
        N: msg.N,
        boundary: msg.boundary,
        V: new Float32Array(size),
        fixed: msg.fixed,
        Vfix: msg.Vfix,
      };
      applyFixedValues(grid);
      iteration = 0;
      running = false;
      runToken++;
      break;
    }
    case "updateFixed": {
      if (!grid) break;
      grid.fixed = msg.fixed;
      grid.Vfix = msg.Vfix;
      applyFixedValues(grid);
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
      applyFixedValues(grid);
      iteration = 0;
      emitProgress(Number.POSITIVE_INFINITY);
      break;
    }
    case "step": {
      if (!grid || running) break;
      let deltaMax = 0;
      for (let s = 0; s < msg.count; s++) {
        deltaMax = relaxStep(grid, msg.omega);
        iteration++;
      }
      emitProgress(deltaMax);
      break;
    }
  }
};

