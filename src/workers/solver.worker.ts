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
let ac: AcConfig = { enabled: false, periodSec: 2 };

// Wall-clock accumulator. Phase advances only while the solver is actively
// running so a pause freezes both the field and the AC angle.
let acPhaseRad = 0;
let lastTickWallMs: number | null = null;

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
    { type: "progress", iteration, deltaMax, V: snap, acPhaseRad },
    [snap.buffer],
  );
}

function emitDone(deltaMax: number, converged: boolean): void {
  if (!grid) return;
  const snap = snapshotV(grid);
  postOut(
    { type: "done", iteration, deltaMax, converged, V: snap, acPhaseRad },
    [snap.buffer],
  );
}

function advancePhaseByWallClock(): void {
  if (!ac.enabled) {
    lastTickWallMs = null;
    return;
  }
  const now = performance.now();
  if (lastTickWallMs !== null && ac.periodSec > 0) {
    const dtSec = (now - lastTickWallMs) / 1000;
    acPhaseRad += (2 * Math.PI * dtSec) / ac.periodSec;
  }
  lastTickWallMs = now;
}

function resetAcPhase(): void {
  acPhaseRad = 0;
  lastTickWallMs = null;
}

function startRun(config: { omega: number; tolerance: number; maxIterations: number; reportEvery: number }): void {
  if (!grid) return;
  running = true;
  const myToken = ++runToken;
  // Begin a fresh wall-clock segment so the first dt is zero, not "time
  // since last run".
  lastTickWallMs = ac.enabled ? performance.now() : null;

  const loop = () => {
    if (!running || myToken !== runToken || !grid) return;
    advancePhaseByWallClock();
    let deltaMax = 0;
    for (let s = 0; s < config.reportEvery; s++) {
      if (ac.enabled) applyModulatedFixed(grid, acPhaseRad);
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
      resetAcPhase();
      break;
    }
    case "updateFixed": {
      if (!grid) break;
      grid.fixed = msg.fixed;
      grid.Vfix = msg.Vfix;
      grid.phase = msg.phase;
      if (ac.enabled) {
        applyModulatedFixed(grid, acPhaseRad);
      } else {
        applyFixedValues(grid);
      }
      break;
    }
    case "setAC": {
      const wasEnabled = ac.enabled;
      ac = { ...msg.ac };
      if (!grid) break;
      // Toggling AC on starts a fresh wave from phase 0; toggling off snaps
      // fixed cells back to their static amplitude. Period changes mid-run
      // keep the accumulated phase so the wave doesn't jump.
      if (ac.enabled && !wasEnabled) {
        resetAcPhase();
        if (running) lastTickWallMs = performance.now();
        applyModulatedFixed(grid, acPhaseRad);
      } else if (!ac.enabled && wasEnabled) {
        lastTickWallMs = null;
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
      // Drop the wall-clock anchor so the phase doesn't jump on resume.
      lastTickWallMs = null;
      break;
    }
    case "reset": {
      if (!grid) break;
      running = false;
      runToken++;
      grid.V.fill(0);
      iteration = 0;
      resetAcPhase();
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
      advancePhaseByWallClock();
      let deltaMax = 0;
      for (let s = 0; s < msg.count; s++) {
        if (ac.enabled) applyModulatedFixed(grid, acPhaseRad);
        deltaMax = relaxStep(grid, msg.omega);
        iteration++;
      }
      emitProgress(deltaMax);
      break;
    }
  }
};
