/**
 * Physical specs of the solenoid used throughout Laboratorio 1 — measured by
 * hand on the day of the practice (they appear on no guide or data sheet):
 * 120 turns over 406 mm, giving the turn density n = N/L the textbook
 * infinite-solenoid formula needs. With an aspect ratio L/D ≈ 3.4 (406 mm
 * over a 120 mm diameter) this is a fairly short, wide coil — not the "long
 * thin" limit the ideal formula assumes, which matters for how well
 * {@link theoreticalFieldMt} should be expected to agree with what was
 * actually measured.
 */
export const SOLENOID_TURNS = 120;
/** Solenoid length, in metres. */
export const SOLENOID_LENGTH_M = 0.406;
/** Instrument error on {@link SOLENOID_LENGTH_M}, in metres. */
export const SOLENOID_LENGTH_ERROR_M = 0.0005;
/** Solenoid diameter, in metres. */
export const SOLENOID_DIAMETER_M = 0.12;
/** Instrument error on {@link SOLENOID_DIAMETER_M}, in metres. */
export const SOLENOID_DIAMETER_ERROR_M = 0.0005;

const MU_0 = 4 * Math.PI * 1e-7;

export interface TheoreticalField {
  /** B = μ₀·n·I for an ideal infinite solenoid, in mT. */
  fieldMt: number;
  /** Propagated error, in mT. */
  errorMt: number;
}

/**
 * B = μ₀·n·I, n = N/L. Error propagated from the current and length
 * measurements only — the turn count N is an exact integer, not a measured
 * quantity with its own uncertainty.
 */
export function theoreticalFieldMt(
  currentA: number,
  currentErrorA: number,
  turns = SOLENOID_TURNS,
  lengthM = SOLENOID_LENGTH_M,
  lengthErrorM = SOLENOID_LENGTH_ERROR_M,
): TheoreticalField {
  const n = turns / lengthM;
  const fieldT = MU_0 * n * currentA;
  const dBdI = MU_0 * n;
  const dBdL = (MU_0 * turns * currentA) / (lengthM * lengthM);
  const errorT = dBdI * currentErrorA + dBdL * lengthErrorM;
  return { fieldMt: fieldT * 1e3, errorMt: errorT * 1e3 };
}
