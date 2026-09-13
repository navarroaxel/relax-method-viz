/**
 * Laboratorio 2 — per-point instrumental error propagation for
 * μ₀ = 2πFr/(I²l), exactly as the guide's own §2.2 error formula prescribes
 * (see {@link errorTerms} in `lab2Geometry`): the absolute error is the sum
 * of the partial derivatives of μ₀ with respect to I, l, F and r, each times
 * that variable's own instrument tolerance.
 *
 * `errorTerms` already evaluates that budget at a single operating point —
 * this module repackages it as a [μ₀−Δμ₀, μ₀+Δμ₀] band and applies it to
 * every logged (I, F) point of a run, not just the fitted slope's strongest
 * point, so each point can be checked against the accepted μ₀ on its own.
 */

import {
  CURRENT_ERROR_A,
  errorTerms,
  FORCE_ERROR_MN,
  FORCE_LENGTH_M,
  LENGTH_ERROR_M,
  MU0_ACCEPTED,
  SEPARATION_ERROR_M,
  SEPARATION_M,
} from "./lab2Geometry";

export interface PointMu0Error {
  currentA: number;
  forceMn: number;
  /** μ₀ = 2πFr/(I²l) at this point, ideal two-wire model, in H/m. */
  mu0HPerM: number;
  /** Propagated absolute error Δμ₀ (§2.2), in H/m. */
  errorHPerM: number;
  /** μ₀ + Δμ₀, in H/m. */
  upperHPerM: number;
  /** μ₀ − Δμ₀, in H/m. */
  lowerHPerM: number;
  /** Δμ₀ / μ₀, in percent. */
  errorPct: number;
  /** Whether `reference` (typically {@link MU0_ACCEPTED}) falls within [lower, upper]. */
  containsReference: boolean;
}

/**
 * {@link errorTerms} evaluated at a single (I, F) point and repackaged as a
 * [μ₀−Δμ₀, μ₀+Δμ₀] band, so it can be checked against a reference value —
 * this is what lets each individual point, not just the fitted slope, be
 * compared against the accepted μ₀.
 */
export function propagatePointMu0Error(
  currentA: number,
  forceMn: number,
  reference = MU0_ACCEPTED,
  separationM = SEPARATION_M,
  lengthM = FORCE_LENGTH_M,
  currentErrorA = CURRENT_ERROR_A,
  forceErrorMn = FORCE_ERROR_MN,
  separationErrorM = SEPARATION_ERROR_M,
  lengthErrorM = LENGTH_ERROR_M,
): PointMu0Error {
  const e = errorTerms(
    currentA,
    forceMn,
    separationM,
    lengthM,
    currentErrorA,
    forceErrorMn,
    separationErrorM,
    lengthErrorM,
  );
  const upperHPerM = e.mu0 + e.totalAbs;
  const lowerHPerM = e.mu0 - e.totalAbs;
  return {
    currentA,
    forceMn,
    mu0HPerM: e.mu0,
    errorHPerM: e.totalAbs,
    upperHPerM,
    lowerHPerM,
    errorPct: e.relativePct,
    containsReference: reference >= lowerHPerM && reference <= upperHPerM,
  };
}

export interface Mu0ErrorTable {
  points: PointMu0Error[];
  /** Mean of each point's own μ₀, in H/m — not a fit, just the row average. */
  meanMu0HPerM: number;
  /** Mean of each point's own Δμ₀, in H/m. */
  meanErrorHPerM: number;
  /** Sample standard deviation of the per-point μ₀ values, in H/m. */
  spreadHPerM: number;
}

/**
 * Builds the per-point μ₀ error table for a run's (I, F) readings. Points
 * with |I| below `minCurrentA` are skipped — the near-zero steps of a stepped
 * run blow up μ₀ = 2πFr/(I²l) without carrying information about it.
 */
export function buildMu0ErrorTable(
  currentA: ArrayLike<number>,
  forceMn: ArrayLike<number>,
  reference = MU0_ACCEPTED,
  separationM = SEPARATION_M,
  lengthM = FORCE_LENGTH_M,
  minCurrentA = 0.5,
): Mu0ErrorTable {
  const points: PointMu0Error[] = [];
  for (let k = 0; k < currentA.length; k++) {
    const i = currentA[k] ?? 0;
    if (Math.abs(i) < minCurrentA) continue;
    points.push(
      propagatePointMu0Error(
        i,
        forceMn[k] ?? 0,
        reference,
        separationM,
        lengthM,
      ),
    );
  }

  const n = Math.max(1, points.length);
  const meanMu0HPerM = points.reduce((s, p) => s + p.mu0HPerM, 0) / n;
  const meanErrorHPerM = points.reduce((s, p) => s + p.errorHPerM, 0) / n;
  const variance =
    points.reduce((s, p) => s + (p.mu0HPerM - meanMu0HPerM) ** 2, 0) /
    Math.max(1, points.length - 1);

  return {
    points,
    meanMu0HPerM,
    meanErrorHPerM,
    spreadHPerM: Math.sqrt(variance),
  };
}
