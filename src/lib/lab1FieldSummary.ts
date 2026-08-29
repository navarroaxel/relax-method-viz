/**
 * Combining the four independent routes to B (escalón, continua, indirecta,
 * sonda directa) into a single reportable figure, and comparing the
 * theoretical solenoid value against it — the arithmetic behind Laboratorio
 * 1's "valor promedio del campo" and "comparación con el valor teórico"
 * sections.
 */

export interface FieldSummary {
  /** Mean of the input values, in mT. */
  meanMt: number;
  /** Sample standard deviation (n-1) of the input values, in mT. */
  stdMt: number;
}

/**
 * Mean and sample standard deviation of a set of independent field
 * measurements. The spread between methods is used as the reported error
 * here — it dwarfs any single method's own instrument error, so folding
 * that in separately would not change the result.
 */
export function summarizeFieldRoutes(valuesMt: number[]): FieldSummary {
  const meanMt = valuesMt.reduce((s, v) => s + v, 0) / valuesMt.length;
  const variance =
    valuesMt.reduce((s, v) => s + (v - meanMt) * (v - meanMt), 0) /
    Math.max(1, valuesMt.length - 1);
  return { meanMt, stdMt: Math.sqrt(variance) };
}

/** Signed percent difference of `value` relative to `reference`. */
export function percentDelta(value: number, reference: number): number {
  return ((value - reference) / reference) * 100;
}
