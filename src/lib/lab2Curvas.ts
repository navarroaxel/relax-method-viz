/**
 * Laboratorio 2 — the three stepped F-vs-I runs of lab2.xlsx: guía §3.2(c)
 * run literally, raising I_B1 from 0 to 20 A in ~2 A steps and logging one
 * (I, F) pair with F9 at each step, then repeated twice more with
 * "Adjuntar nueva serie de medición".
 *
 * §3.2(f) asks for those repeats to be taken at *different* separations r.
 * They were not: the three runs land within 1 % of the same slope (see
 * {@link summarizeCurves}), so what they actually measure is the
 * repeatability of the setup, not the 1/r dependence. That is worth having —
 * it puts a number on the random part of the experiment, which turns out to
 * be far smaller than the systematic part — but it does mean this report
 * cannot show F ∝ 1/r.
 */

import {
  FORCE_LENGTH_M,
  geometryFactor,
  MU0_ACCEPTED,
  mu0FromSlopeCorrected,
  mu0FromSlopeIdeal,
  SEPARATION_M,
} from "./lab2Geometria";

export interface CurveSeries {
  /** Short label used on the chart legend. */
  label: string;
  /** Step number, 1-based, as logged. */
  n: number[];
  /** Loop current I_B1, in A. */
  currentA: Float64Array;
  /** Force F_A1, in mN. */
  forceMn: Float64Array;
}

function parseCsv(csv: string): Float64Array {
  const parts = csv.split(",");
  const out = new Float64Array(parts.length);
  for (let k = 0; k < parts.length; k++) out[k] = Number(parts[k]);
  return out;
}

function series(label: string, currents: string, forces: string): CurveSeries {
  const currentA = parseCsv(currents);
  const forceMn = parseCsv(forces);
  return {
    label,
    n: Array.from({ length: currentA.length }, (_, k) => k + 1),
    currentA,
    forceMn,
  };
}

/** The three stepped runs, in the order they were captured. */
export const curveSeries: CurveSeries[] = [
  series(
    "S1",
    "4.89,6.65,9.09,10.92,12.88,15.02,17.14,18.99,20.18",
    "0.47,0.83,1.42,1.99,2.8,3.84,5.01,6.07,6.86",
  ),
  series(
    "S2",
    "3.01,5.01,6.9,9.12,10.99,13.01,14.88,17.13,18.87,20.38",
    "0.2,0.41,0.73,1.29,1.97,2.75,3.56,4.82,5.85,6.95",
  ),
  series(
    "S3",
    "3.31,4.92,6.89,9.03,11.04,12.96,14.93,16.89,18.84,20.01",
    "0.18,0.38,0.79,1.29,1.99,2.76,3.66,4.7,5.88,6.65",
  ),
];

export interface QuadraticFit {
  /** Slope a of F = a·I² + b, in mN/A². */
  slopeMnPerA2: number;
  /** Intercept b, in mN — residual tare left on the sensor after the zeroing. */
  interceptMn: number;
  /** Coefficient of determination of F against I². */
  r2: number;
  /** Largest current in the run, in A. */
  maxCurrentA: number;
  /** Force at that current, in mN. */
  maxForceMn: number;
  /** μ₀ from the ideal two-wire model, in H/m. */
  mu0IdealHPerM: number;
  /** μ₀ with the loop return conductors kept in, in H/m. */
  mu0CorrectedHPerM: number;
}

/**
 * Least squares of F against u = I². Fitting the *linearised* form rather
 * than a parabola in I is the point of the exercise: if F really goes as I²
 * the points fall on a straight line through the origin, and both the
 * straightness (r²) and the offset (b) are diagnostics — b is what the tare
 * left behind, and it is read off the axis rather than absorbed into a.
 */
export function fitQuadratic(
  currentA: Float64Array,
  forceMn: Float64Array,
  separationM = SEPARATION_M,
  lengthM = FORCE_LENGTH_M,
): QuadraticFit {
  const n = currentA.length;
  let su = 0;
  let sf = 0;
  let suu = 0;
  let suf = 0;
  for (let k = 0; k < n; k++) {
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
  const interceptMn = (sf - slopeMnPerA2 * su) / n;

  const meanF = sf / n;
  let ssTot = 0;
  let ssRes = 0;
  for (let k = 0; k < n; k++) {
    const i = currentA[k] ?? 0;
    const f = forceMn[k] ?? 0;
    const pred = slopeMnPerA2 * i * i + interceptMn;
    ssTot += (f - meanF) * (f - meanF);
    ssRes += (f - pred) * (f - pred);
  }

  let maxCurrentA = 0;
  let maxForceMn = 0;
  for (let k = 0; k < n; k++) {
    if ((currentA[k] ?? 0) > maxCurrentA) {
      maxCurrentA = currentA[k] ?? 0;
      maxForceMn = forceMn[k] ?? 0;
    }
  }

  return {
    slopeMnPerA2,
    interceptMn,
    r2: ssTot === 0 ? 0 : 1 - ssRes / ssTot,
    maxCurrentA,
    maxForceMn,
    mu0IdealHPerM: mu0FromSlopeIdeal(slopeMnPerA2, separationM, lengthM),
    mu0CorrectedHPerM: mu0FromSlopeCorrected(
      slopeMnPerA2,
      geometryFactor(separationM),
      lengthM,
    ),
  };
}

export interface CurvesSummary {
  fits: QuadraticFit[];
  /** Mean slope across the runs, in mN/A². */
  meanSlopeMnPerA2: number;
  /** Full spread of the slopes as a percentage of the mean. */
  slopeSpreadPct: number;
  /** Mean of the per-run ideal μ₀, in H/m. */
  meanMu0IdealHPerM: number;
  /** Mean of the per-run corrected μ₀, in H/m. */
  meanMu0CorrectedHPerM: number;
  /**
   * Separation each run implies if μ₀ is taken as known and the ideal model
   * is trusted, in metres — the honest way to read the disagreement: the
   * ideal formula needs the wires ~20 % further apart than they were.
   */
  impliedSeparationM: number[];
}

/** Fit every run and collapse the three into the figures the report quotes. */
export function summarizeCurves(
  runs: CurveSeries[] = curveSeries,
  separationM = SEPARATION_M,
  lengthM = FORCE_LENGTH_M,
): CurvesSummary {
  const fits = runs.map((s) =>
    fitQuadratic(s.currentA, s.forceMn, separationM, lengthM),
  );
  const slopes = fits.map((f) => f.slopeMnPerA2);
  const meanSlopeMnPerA2 = slopes.reduce((a, b) => a + b, 0) / slopes.length;
  const spread = Math.max(...slopes) - Math.min(...slopes);

  const mean = (values: number[]) =>
    values.reduce((a, b) => a + b, 0) / values.length;

  return {
    fits,
    meanSlopeMnPerA2,
    slopeSpreadPct: (spread / meanSlopeMnPerA2) * 100,
    meanMu0IdealHPerM: mean(fits.map((f) => f.mu0IdealHPerM)),
    meanMu0CorrectedHPerM: mean(fits.map((f) => f.mu0CorrectedHPerM)),
    // μ₀ = 2πra/l is linear in r, so the r that would have made the ideal
    // model land on the accepted μ₀ is just r scaled by the ratio of the two.
    impliedSeparationM: fits.map(
      (f) => (separationM * MU0_ACCEPTED) / f.mu0IdealHPerM,
    ),
  };
}
