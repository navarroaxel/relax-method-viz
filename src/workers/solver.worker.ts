/// <reference lib="webworker" />

import { applyFixedValues, applyModulatedFixed } from "@/lib/grid";
import { relaxStep } from "@/lib/relaxation";
import type { AcConfig, GridState } from "@/types";
import type { WorkerInbound, WorkerOutbound } from "@/types/worker";

declare const self: DedicatedWorkerGlobalScope;

let grid: GridState | null = null;
let running = false;
let iteration = 0;
let runToken = 0;
let ac: AcConfig = { enabled: false, period: 200 };

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

function modulationOmegaT(): number {
  // Cycles per iteration = 1 / period, so angular argument is 2π·iter/period.
  return (2 * Math.PI * iteration) / Math.max(1, ac.period);
}

function startRun(config: { omega: number; tolerance: number; maxIterations: number; reportEvery: number }): void {
  if (!grid) return;
  running = true;
  const myToken = ++runToken;

  const loop = () => {
    if (!running || myToken !== runToken || !grid) return;
    let deltaMax = 0;
    for (let s = 0; s < config.reportEvery; s++) {
      if (ac.enabled) {
        applyModulatedFixed(grid, modulationOmegaT());
      }
      deltaMax = relaxStep(grid, config.omega);
      iteration++;
      // While AC is on the field never settles, so convergence/maxIterations
      // stops are skipped — the user pauses manually.
      if (!ac.enabled) {
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
        phase: msg.phase,
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
      grid.phase = msg.phase;
      if (ac.enabled) {
        applyModulatedFixed(grid, modulationOmegaT());
      } else {
        applyFixedValues(grid);
      }
      break;
    }
    case "setAC": {
      ac = { ...msg.ac };
      if (!grid) break;
      // Re-stamp fixed cells immediately so the snapshot reflects the change
      // even if the loop is paused.
      if (ac.enabled) {
        applyModulatedFixed(grid, modulationOmegaT());
      } else {
        applyFixedValues(grid);
      }
      emitProgress(Number.POSITIVE_INFINITY);
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
      if (ac.enabled) {
        applyModulatedFixed(grid, 0);
      } else {
        applyFixedValues(grid);
      }
      emitProgress(Number.POSITIVE_INFINITY);
      break;
    }
    case "step": {
      if (!grid || running) break;
      let deltaMax = 0;
      for (let s = 0; s < msg.count; s++) {
        if (ac.enabled) {
          applyModulatedFixed(grid, modulationOmegaT());
        }
        deltaMax = relaxStep(grid, msg.omega);
        iteration++;
      }
      emitProgress(deltaMax);
      break;
    }
  }
};
