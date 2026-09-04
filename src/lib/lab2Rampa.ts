/**
 * Laboratorio 2 — the continuous sweep of lab2.xlsx: 314 (I, F) samples
 * logged while the supply knob was walked from ~3 A up to 20 A and straight
 * back down again, instead of the stepped F9 captures of
 * {@link curveSeries}.
 *
 * The stepped runs wait at each current before logging, so they only ever see
 * the force sensor at rest. This one never waits, and that is its value: the
 * up and down branches do not retrace, and the gap between them is the
 * sensor's own lag written out on the F-vs-I plane. It is the direct check
 * that the stepped runs waited long enough — the same lesson the escalón
 * capture teaches in the time domain (see {@link lab2Escalon}).
 *
 * There is no time column on this sheet, so everything here is indexed by
 * sample rather than by seconds.
 */

import {
  FORCE_LENGTH_M,
  geometryFactor,
  mu0FromSlopeCorrected,
  mu0FromSlopeIdeal,
  SEPARATION_M,
} from "./lab2Geometria";

const RAMP_CURRENT_A_CSV =
  "3.03,3.17,3.24,3.44,3.45,3.51,3.6,3.6,3.66,3.75,3.87,4.01,4.17,4.21," +
  "4.3,4.44,4.68,4.82,4.97,5.1,5.13,5.17,5.25,5.4,5.64,5.73,5.81,5.96," +
  "6.02,6.09,6.18,6.27,6.36,6.48,6.54,6.63,6.71,6.83,7.05,7.18,7.35,7.49," +
  "7.77,8.12,8.46,8.76,8.97,9.15,9.26,9.46,9.68,9.92,10.19,10.42,10.75,11.05," +
  "11.27,11.47,11.69,11.88,12.02,12.02,12.22,12.36,12.57,12.82,12.99,13.1,13.35,13.53," +
  "13.63,13.67,13.79,13.88,14,14.14,14.25,14.4,14.55,14.71,14.88,15.09,15.29,15.42," +
  "15.53,15.69,15.86,16.09,16.34,16.39,16.43,16.47,16.61,16.83,17.04,17.14,17.19,17.23," +
  "17.34,17.53,17.62,17.77,17.86,17.91,17.92,18.04,18.15,18.21,18.37,18.63,18.72,18.72," +
  "18.78,18.87,18.87,18.95,18.99,19.02,19.13,19.21,19.24,19.3,19.39,19.5,19.77,19.96," +
  "20.07,20.07,20.01,19.77,19.29,19.09,19.06,19.05,19.02,18.99,18.97,18.87,18.76,18.69," +
  "18.48,18.31,18.22,18.16,18.1,18.03,17.97,17.89,17.82,17.74,17.61,17.55,17.4,17.29," +
  "17.23,17.22,17.16,17.11,17.08,17.02,16.82,16.65,16.5,16.44,16.39,16.35,16.34,16.25," +
  "16.25,16.08,15.92,15.78,15.63,15.59,15.5,15.45,15.41,15.27,15.22,15.15,14.98,14.89," +
  "14.8,14.78,14.69,14.56,14.55,14.49,14.32,14.21,14.05,13.89,13.8,13.67,13.59,13.47," +
  "13.3,13.14,13.05,12.97,12.93,12.86,12.77,12.66,12.48,12.38,12.27,12.08,11.9,11.82," +
  "11.75,11.6,11.56,11.51,11.38,11.31,11.23,11.08,10.83,10.74,10.74,10.7,10.7,10.59," +
  "10.5,10.46,10.37,10.22,9.99,9.78,9.64,9.59,9.54,9.48,9.35,9.2,9.09,8.96," +
  "8.89,8.78,8.65,8.63,8.55,8.47,8.36,8.28,8.19,8.13,7.96,7.85,7.8,7.71," +
  "7.53,7.49,7.46,7.35,7.3,7.26,7.15,7.13,7.04,6.98,6.9,6.72,6.65,6.57," +
  "6.45,6.38,6.24,6.13,6.07,5.97,5.85,5.81,5.81,5.71,5.69,5.61,5.47,5.35," +
  "5.26,5.21,5.09,5.01,4.97,4.92,4.79,4.63,4.58,4.51,4.44,4.38,4.35,4.3," +
  "4.2,4.1,4.02,3.93,3.83,3.72,3.65,3.58,3.57,3.5,3.48,3.45,3.42,3.38," +
  "3.3,3.25,3.23,3.18,3.15,3.07";

const RAMP_FORCE_MN_CSV =
  "0.15,0.19,0.21,0.19,0.19,0.22,0.22,0.22,0.22,0.24,0.27,0.3,0.3,0.32," +
  "0.34,0.33,0.35,0.38,0.4,0.43,0.45,0.45,0.47,0.49,0.49,0.52,0.58,0.58," +
  "0.59,0.6,0.63,0.66,0.68,0.69,0.72,0.73,0.73,0.77,0.8,0.84,0.88,0.9," +
  "0.93,0.98,1.07,1.17,1.27,1.33,1.33,1.36,1.44,1.49,1.6,1.69,1.78,1.86," +
  "1.99,2.06,2.06,2.15,2.25,2.3,2.35,2.4,2.5,2.58,2.68,2.76,2.81,2.9," +
  "3,3.02,3.04,3.1,3.15,3.19,3.26,3.35,3.43,3.48,3.56,3.63,3.7,3.83," +
  "3.9,3.96,4.04,4.13,4.24,4.38,4.44,4.46,4.47,4.55,4.67,4.77,4.82,4.88," +
  "4.88,4.92,5.03,5.11,5.19,5.25,5.29,5.3,5.36,5.42,5.49,5.53,5.67,5.67," +
  "5.77,5.79,5.81,5.86,5.92,5.93,5.96,5.97,6.04,6.06,6.12,6.15,6.25,6.38," +
  "6.53,6.64,6.66,6.63,6.51,6.23,6,5.98,5.96,5.94,5.93,5.92,5.9,5.83," +
  "5.79,5.67,5.57,5.49,5.45,5.43,5.38,5.33,5.29,5.27,5.23,5.16,5.11,5.04," +
  "4.98,4.93,4.92,4.9,4.83,4.83,4.79,4.7,4.59,4.51,4.46,4.46,4.45,4.44," +
  "4.41,4.39,4.33,4.21,4.15,4.07,4.03,3.98,3.96,3.93,3.88,3.84,3.81,3.7," +
  "3.66,3.62,3.58,3.54,3.48,3.46,3.44,3.36,3.32,3.27,3.18,3.13,3.06,3.01," +
  "2.98,2.92,2.86,2.79,2.75,2.69,2.68,2.67,2.63,2.55,2.49,2.46,2.4,2.31," +
  "2.22,2.21,2.15,2.1,2.1,2.09,2.06,2.03,2.03,2,1.91,1.85,1.85,1.84," +
  "1.8,1.77,1.74,1.7,1.64,1.57,1.49,1.43,1.42,1.4,1.39,1.34,1.27,1.24," +
  "1.21,1.19,1.15,1.09,1.08,1.05,1.02,0.99,0.97,0.94,0.93,0.87,0.86,0.83," +
  "0.82,0.8,0.76,0.77,0.74,0.7,0.71,0.72,0.7,0.68,0.66,0.63,0.6,0.57," +
  "0.53,0.52,0.54,0.48,0.47,0.47,0.47,0.48,0.49,0.46,0.44,0.43,0.35,0.37," +
  "0.36,0.33,0.3,0.26,0.2,0.22,0.24,0.21,0.15,0.2,0.15,0.15,0.18,0.18," +
  "0.14,0.1,0.07,0.14,0.18,0.16,0.13,0.14,0.13,0.12,0.13,0.12,0.11,0.1," +
  "0.11,0.12,0.1,0.08,0.04,0.07";

function parseCsv(csv: string): Float64Array {
  const parts = csv.split(",");
  const out = new Float64Array(parts.length);
  for (let k = 0; k < parts.length; k++) out[k] = Number(parts[k]);
  return out;
}

/** Loop current I_B1 over the sweep, in A. */
export const rampCurrentA: Float64Array = parseCsv(RAMP_CURRENT_A_CSV);

/** Force F_A1 over the sweep, in mN, sampled alongside {@link rampCurrentA}. */
export const rampForceMn: Float64Array = parseCsv(RAMP_FORCE_MN_CSV);

export interface BranchFit {
  /** Slope a of F = a·I² + b, in mN/A². */
  slopeMnPerA2: number;
  /** Intercept b, in mN. */
  interceptMn: number;
  /** Coefficient of determination of F against I². */
  r2: number;
}

/** Least squares of F against I² over the given sample indices. */
export function fitBranch(
  currentA: Float64Array,
  forceMn: Float64Array,
  indices: number[],
): BranchFit {
  const n = indices.length;
  let su = 0;
  let sf = 0;
  let suu = 0;
  let suf = 0;
  for (const k of indices) {
    const i = currentA[k] ?? 0;
    const u = i * i;
    const f = forceMn[k] ?? 0;
    su += u;
    sf += f;
    suu += u * u;
    suf += u * f;
  }
  const denom = n * suu - su * su;
  const slopeMnPerA2 = denom === 0 ? 0 : (n * suf - su * sf) / denom;
  const interceptMn = n === 0 ? 0 : (sf - slopeMnPerA2 * su) / n;

  const meanF = n === 0 ? 0 : sf / n;
  let ssTot = 0;
  let ssRes = 0;
  for (const k of indices) {
    const i = currentA[k] ?? 0;
    const f = forceMn[k] ?? 0;
    const pred = slopeMnPerA2 * i * i + interceptMn;
    ssTot += (f - meanF) * (f - meanF);
    ssRes += (f - pred) * (f - pred);
  }

  return {
    slopeMnPerA2,
    interceptMn,
    r2: ssTot === 0 ? 0 : 1 - ssRes / ssTot,
  };
}

export interface RampAnalysis {
  /** Sample index at which the sweep turns around. */
  peakIndex: number;
  /** Current at the turning point, in A. */
  peakCurrentA: number;
  /** Force at the turning point, in mN. */
  peakForceMn: number;
  /** Fit over every sample of the sweep. */
  overall: BranchFit;
  /** Fit over the rising branch only. */
  rising: BranchFit;
  /** Fit over the falling branch only. */
  falling: BranchFit;
  /**
   * Mean vertical gap between the two branches over the current range they
   * share, in mN — the width of the hysteresis loop.
   */
  gapMn: number;
  /** That gap as a percentage of the force at the turning point. */
  hysteresisPct: number;
  /** μ₀ from the overall fit, ideal two-wire model, in H/m. */
  mu0IdealHPerM: number;
  /** μ₀ from the overall fit with the loop return conductors kept in. */
  mu0CorrectedHPerM: number;
}

/**
 * Split the sweep at its turning point, fit each branch, and measure how far
 * apart they sit.
 *
 * The gap is taken on a grid of currents spanned by both branches: at each
 * grid current the two branch fits are evaluated and subtracted, which is
 * more stable than pairing raw samples that never land on the same current.
 * A falling branch that reads *lower* than the rising one is the expected
 * sign — the sensor is still catching up in both directions.
 */
export function analyzeRamp(
  currentA: Float64Array = rampCurrentA,
  forceMn: Float64Array = rampForceMn,
  separationM = SEPARATION_M,
  lengthM = FORCE_LENGTH_M,
): RampAnalysis {
  const n = currentA.length;
  let peakIndex = 0;
  for (let k = 1; k < n; k++) {
    if ((currentA[k] ?? 0) > (currentA[peakIndex] ?? 0)) peakIndex = k;
  }

  const all = Array.from({ length: n }, (_, k) => k);
  const risingIdx = all.slice(0, peakIndex + 1);
  const fallingIdx = all.slice(peakIndex);

  const overall = fitBranch(currentA, forceMn, all);
  const rising = fitBranch(currentA, forceMn, risingIdx);
  const falling = fitBranch(currentA, forceMn, fallingIdx);

  const at = (fit: BranchFit, i: number) =>
    fit.slopeMnPerA2 * i * i + fit.interceptMn;

  const lo = Math.max(
    Math.min(...risingIdx.map((k) => currentA[k] ?? 0)),
    Math.min(...fallingIdx.map((k) => currentA[k] ?? 0)),
  );
  const hi = Math.min(
    Math.max(...risingIdx.map((k) => currentA[k] ?? 0)),
    Math.max(...fallingIdx.map((k) => currentA[k] ?? 0)),
  );
  const steps = 64;
  let gapSum = 0;
  for (let s = 0; s <= steps; s++) {
    const i = lo + ((hi - lo) * s) / steps;
    gapSum += at(rising, i) - at(falling, i);
  }
  const gapMn = gapSum / (steps + 1);

  const peakForceMn = forceMn[peakIndex] ?? 0;

  return {
    peakIndex,
    peakCurrentA: currentA[peakIndex] ?? 0,
    peakForceMn,
    overall,
    rising,
    falling,
    gapMn,
    hysteresisPct:
      peakForceMn === 0 ? 0 : (Math.abs(gapMn) / peakForceMn) * 100,
    mu0IdealHPerM: mu0FromSlopeIdeal(
      overall.slopeMnPerA2,
      separationM,
      lengthM,
    ),
    mu0CorrectedHPerM: mu0FromSlopeCorrected(
      overall.slopeMnPerA2,
      geometryFactor(separationM),
      lengthM,
    ),
  };
}
