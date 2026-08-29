/**
 * Laboratorio 1 — the "medicion_indirecta" sheet of lab1.xlsx: the literal
 * point-by-point procedure from guía §3.2(d) — raise the loop current in
 * ~2 A steps and log one value with F9 at each step — repeated across four
 * separate sessions.
 *
 * Each session meant re-seating the loop in the solenoid's slit, which is
 * narrow enough that the loop can graze the coil, and the force sensor is
 * sensitive to knocks on the bench. Four independent sessions are the way to
 * average that mechanical noise out rather than bound it with a single
 * instrument-error figure, which the guide's own error formula (ΔB from ΔI,
 * Δl, ΔF) cannot capture.
 */

import { fitLine, type LineFit } from "./lab1MedicionContinua";

export interface IndirectSession {
  label: string;
  n: number[];
  forceMn: Float64Array;
  currentA: Float64Array;
}

export const indirectSessions: IndirectSession[] = [
  {
    label: "A",
    n: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    forceMn: Float64Array.from([
      0.285, 0.595, 0.81, 1.165, 1.41, 1.665, 1.955, 2.245, 2.65,
    ]),
    currentA: Float64Array.from([
      2.07, 4.08, 5.88, 8.12, 10.01, 12.09, 13.92, 15.93, 19.05,
    ]),
  },
  {
    label: "B",
    n: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    forceMn: Float64Array.from([
      0.03, 0.37, 0.62, 0.8, 1.14, 1.37, 1.63, 1.91, 2.14, 2.44, 3.11,
    ]),
    currentA: Float64Array.from([
      -0.01, 2.01, 4.01, 5.96, 7.98, 10.02, 11.89, 13.94, 16.02, 17.91, 20.03,
    ]),
  },
  {
    label: "C",
    n: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    forceMn: Float64Array.from([
      0.06, 0.28, 0.5, 0.79, 1.06, 1.28, 1.58, 1.83, 2.04, 2.34, 2.56,
    ]),
    currentA: Float64Array.from([
      -0.01, 1.98, 3.87, 5.96, 7.98, 9.97, 12.0, 13.94, 15.91, 18.02, 20.03,
    ]),
  },
  {
    label: "D",
    n: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    forceMn: Float64Array.from([
      -0.02, 0.26, 0.55, 0.76, 0.94, 1.24, 1.53, 1.78, 2.07, 2.36, 2.56, 2.66,
    ]),
    currentA: Float64Array.from([
      -0.01, 2.04, 4.04, 5.9, 7.98, 10.06, 11.89, 13.94, 15.84, 18.03, 18.95,
      20.05,
    ]),
  },
];

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const a = sorted[mid] ?? 0;
  if (sorted.length % 2 === 1) return a;
  const b = sorted[mid - 1] ?? 0;
  return (a + b) / 2;
}

/**
 * Theil–Sen fit: slope is the median of all pairwise slopes, intercept the
 * median of the resulting per-point intercepts. A single bad point corrupts
 * only the handful of pairs it takes part in, so — unlike ordinary least
 * squares — this line does not itself get dragged towards an outlier, which
 * is what makes it useful as the reference for flagging one.
 */
function theilSenFit(
  force: Float64Array,
  current: Float64Array,
): { slope: number; intercept: number } {
  const slopes: number[] = [];
  const n = force.length;
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      const dI = (current[b] ?? 0) - (current[a] ?? 0);
      if (Math.abs(dI) > 1e-9) {
        slopes.push(((force[b] ?? 0) - (force[a] ?? 0)) / dI);
      }
    }
  }
  const slope = slopes.length > 0 ? median(slopes) : 0;
  const intercepts: number[] = [];
  for (let k = 0; k < n; k++) {
    intercepts.push((force[k] ?? 0) - slope * (current[k] ?? 0));
  }
  return { slope, intercept: median(intercepts) };
}

export interface IndirectSessionAnalysis {
  /** Least-squares fit over every point in the session. */
  fitAll: LineFit;
  /** Least-squares fit excluding the flagged points, if any. */
  fitClean: LineFit;
  /** F − (robust-slope·I + robust-intercept) for every point, in mN. */
  residualsMn: Float64Array;
  /** Indices whose residual is a robust outlier within this session. */
  outlierIndices: number[];
}

/**
 * A point is flagged when its residual against the session's Theil–Sen line
 * exceeds `madFactor` times the median absolute residual (MAD) — the classic
 * robust-outlier rule, using a fit that one bad point cannot itself distort.
 */
export function analyzeIndirectSession(
  session: IndirectSession,
  loopLengthM: number,
  madFactor = 4,
): IndirectSessionAnalysis {
  const { forceMn, currentA } = session;
  const n = forceMn.length;
  const indices = Array.from({ length: n }, (_, k) => k);

  const robust = theilSenFit(forceMn, currentA);
  const residualsMn = Float64Array.from(
    indices,
    (k) =>
      (forceMn[k] ?? 0) - (robust.slope * (currentA[k] ?? 0) + robust.intercept),
  );

  const absResiduals = Array.from(residualsMn, Math.abs);
  const mad = median(absResiduals) || 1e-6;
  const outlierIndices = indices.filter(
    (k) => (absResiduals[k] ?? 0) > madFactor * mad,
  );

  const cleanIndices = indices.filter((k) => !outlierIndices.includes(k));
  const fitAll = fitLine(forceMn, currentA, indices, loopLengthM);
  const fitClean = fitLine(forceMn, currentA, cleanIndices, loopLengthM);

  return { fitAll, fitClean, residualsMn, outlierIndices };
}

export interface IndirectSummary {
  sessions: IndirectSessionAnalysis[];
  /** B implied by each session's clean fit, in mT. */
  fieldsMt: number[];
  /** Mean of {@link fieldsMt}. */
  meanFieldMt: number;
  /** Sample standard deviation of {@link fieldsMt} — the repeatability error. */
  fieldSpreadMt: number;
  /** Total points logged, and how many were flagged across all sessions. */
  totalPoints: number;
  totalOutliers: number;
}

export function summarizeIndirect(
  sessions: IndirectSession[],
  loopLengthM: number,
): IndirectSummary {
  const analyses = sessions.map((s) => analyzeIndirectSession(s, loopLengthM));
  const fieldsMt = analyses.map((a) => a.fitClean.fieldMt);
  const meanFieldMt = fieldsMt.reduce((s, v) => s + v, 0) / fieldsMt.length;
  const variance =
    fieldsMt.reduce((s, v) => s + (v - meanFieldMt) * (v - meanFieldMt), 0) /
    Math.max(1, fieldsMt.length - 1);

  return {
    sessions: analyses,
    fieldsMt,
    meanFieldMt,
    fieldSpreadMt: Math.sqrt(variance),
    totalPoints: sessions.reduce((s, sess) => s + sess.forceMn.length, 0),
    totalOutliers: analyses.reduce((s, a) => s + a.outlierIndices.length, 0),
  };
}
