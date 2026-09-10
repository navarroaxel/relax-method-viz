/**
 * Laboratorio 1 — per-point instrumental error propagation for B = F / (I·l),
 * exactly as the guide's own error formula prescribes (see `errorFormula` /
 * `errorNote` in the page copy): the absolute error is the sum of the partial
 * derivatives of B with respect to I, l and F, each times that variable's own
 * instrument tolerance.
 *
 *   ΔB = (F / I²l)·ΔI + (F / I l²)·Δl + (1 / I l)·ΔF
 *
 * Tolerances come straight from the instrument table (§3.1 of the guide):
 * the loop-current source is rated <2.5 %, the force sensor <1 %, and the
 * loop length was measured by hand with a ruler good to ±0.5 mm.
 */

/** Relative tolerance of the current sources (Fuente 20 A / 5 A), per §3.1. */
export const CURRENT_ERROR_REL = 0.025;

/** Relative tolerance of the force sensor (Sensor de Fuerza S), per §3.1. */
export const FORCE_ERROR_REL = 0.01;

/** Absolute tolerance of the ruler used to measure the loop, per §3.1. */
export const LENGTH_ERROR_M = 0.0005;

export interface PointFieldError {
  currentA: number;
  forceMn: number;
  /** B = F / (I·l), in mT. */
  fieldMt: number;
  /** Propagated absolute error, in mT. */
  errorMt: number;
  /** B + ΔB, in mT. */
  upperMt: number;
  /** B − ΔB, in mT. */
  lowerMt: number;
  /** ΔB / B, in percent. */
  errorPct: number;
  /** Whether `reference` (typically the theoretical B) falls within [lower, upper]. */
  containsReference: boolean;
}

/**
 * B and its propagated instrumental error at a single (I, F) point, using the
 * guide's own error formula. `reference`, when given, is checked against the
 * resulting [B − ΔB, B + ΔB] band — this is how one sees whether the
 * theoretical field falls within the measurement's own tolerance.
 */
export function propagatePointError(
  forceMn: number,
  currentA: number,
  lengthM: number,
  reference?: number,
  currentErrorRel = CURRENT_ERROR_REL,
  forceErrorRel = FORCE_ERROR_REL,
  lengthErrorM = LENGTH_ERROR_M,
): PointFieldError {
  const fieldMt = forceMn / (currentA * lengthM);
  const currentErrorA = currentErrorRel * Math.abs(currentA);
  const forceErrorMn = forceErrorRel * Math.abs(forceMn);

  const errorMt =
    Math.abs(forceMn / (currentA * currentA * lengthM)) * currentErrorA +
    Math.abs(forceMn / (currentA * lengthM * lengthM)) * lengthErrorM +
    Math.abs(1 / (currentA * lengthM)) * forceErrorMn;

  const upperMt = fieldMt + errorMt;
  const lowerMt = fieldMt - errorMt;

  return {
    currentA,
    forceMn,
    fieldMt,
    errorMt,
    upperMt,
    lowerMt,
    errorPct: (errorMt / Math.abs(fieldMt)) * 100,
    containsReference:
      reference === undefined
        ? false
        : reference >= lowerMt && reference <= upperMt,
  };
}

export interface FieldErrorTable {
  points: PointFieldError[];
  /** Mean of each point's own B, in mT — not a fit, just the row average. */
  meanFieldMt: number;
  /** Mean of each point's own ΔB, in mT (the guide's merged "ΔB" column). */
  meanErrorMt: number;
  /** Sample standard deviation of the per-point B values, in mT. */
  spreadMt: number;
}

/**
 * Builds the guide's per-point error table for a set of (I, F) readings.
 * Points with |I| below `minCurrentA` are skipped — near-zero calibration
 * readings blow up B = F/(I·l) without carrying any information about the
 * field.
 */
export function buildFieldErrorTable(
  forceMn: ArrayLike<number>,
  currentA: ArrayLike<number>,
  lengthM: number,
  reference?: number,
  minCurrentA = 0.5,
): FieldErrorTable {
  const points: PointFieldError[] = [];
  for (let k = 0; k < forceMn.length; k++) {
    const i = currentA[k] ?? 0;
    if (Math.abs(i) < minCurrentA) continue;
    points.push(propagatePointError(forceMn[k] ?? 0, i, lengthM, reference));
  }

  const n = Math.max(1, points.length);
  const meanFieldMt = points.reduce((s, p) => s + p.fieldMt, 0) / n;
  const meanErrorMt = points.reduce((s, p) => s + p.errorMt, 0) / n;
  const variance =
    points.reduce((s, p) => s + (p.fieldMt - meanFieldMt) ** 2, 0) /
    Math.max(1, points.length - 1);

  return {
    points,
    meanFieldMt,
    meanErrorMt,
    spreadMt: Math.sqrt(variance),
  };
}
