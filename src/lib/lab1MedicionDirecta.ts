/**
 * Laboratorio 1 — the "Medicion_directa" sheet of lab1.xlsx: a Hall probe
 * dropped through the solenoid's slit and swept by hand to different
 * positions (and, once, a different orientation) while the coil ran at a
 * fixed, precisely-read current. Only 14 points, no position column, but
 * confirmed by hand (see `POSITION_LABELS` below): the probe was kept
 * parallel to the solenoid's axis — the only orientation that reads the
 * axial field it produces — for every point except one.
 *
 * That matters for the "outside" points: with the probe still aligned but
 * sitting beyond the coil's core, most of the near-zero readings are not a
 * bad alignment — they are the field itself, which a solenoid does not
 * project outside its own core. The one exception (n=3) reads near zero for
 * the opposite reason: still right at the tip, where the field is real, but
 * with the probe turned 90° off the axis it needs to align with.
 *
 * Its point is twofold: it is the third, completely independent route to B
 * that the other two sections' `fieldCompare` / `fieldThree` / `fieldFour`
 * lean on, and its off-centre points are a sanity check on the theory —
 * a finite solenoid's end field should sit at roughly half the centre value.
 */

/** Coil current during this capture, in A — read directly off the supply. */
export const COIL_CURRENT_A = 5.04;
/** Instrument error on {@link COIL_CURRENT_A}, in A. */
export const COIL_CURRENT_ERROR_A = 0.005;

export type ProbePosition = "center" | "end" | "outside";

/**
 * Where the probe sat for each of the 14 points, confirmed against the raw
 * values: a stable ~1.7 mT plateau (n=8-11) is the centre; ~half that
 * magnitude with a flipped sign (n=1,2,7) is the end of the coil, still
 * parallel but turned end-for-end. Everything else (n=3-6, 12-14) reads near
 * zero, but not all for the same reason — most (n=4,5,12-14) because the
 * probe was outside the solenoid's core, where there is simply no field to
 * read; n=3 because it was still at the tip, just turned transversal (90°
 * off the axis), and n=6 because it was outside but beneath the winding
 * rather than past the coil's end.
 */
export const POSITION_LABELS: ProbePosition[] = [
  "end", // n=1
  "end", // n=2
  "outside", // n=3 — at the tip, but probe transversal (perpendicular) to B
  "outside", // n=4
  "outside", // n=5
  "outside", // n=6 — outside, but beneath the winding, not past its end
  "end", // n=7
  "center", // n=8
  "center", // n=9
  "center", // n=10
  "center", // n=11
  "outside", // n=12
  "outside", // n=13
  "outside", // n=14
];

/** Field reading B_A1, in mT, one per point of {@link POSITION_LABELS}. */
export const directFieldMt: Float64Array = Float64Array.from([
  -0.83, -0.81, -0.2, -0.18, -0.09, 0.17, -0.81, 1.7, 1.72, 1.69, 1.7, 0.09,
  -0.09, -0.08,
]);

function mean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function sampleStd(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance =
    values.reduce((s, v) => s + (v - m) * (v - m), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export interface PositionGroup {
  position: ProbePosition;
  count: number;
  /** Mean of the signed readings, in mT. */
  meanMt: number;
  /** Sample standard deviation of the signed readings, in mT. */
  stdMt: number;
  /** Mean of |B|, in mT — the end reading flips sign end-for-end from centre. */
  meanAbsMt: number;
}

export function groupByPosition(
  field: Float64Array,
  labels: ProbePosition[],
): Record<ProbePosition, PositionGroup> {
  const byPosition: Record<ProbePosition, number[]> = {
    center: [],
    end: [],
    outside: [],
  };
  for (let k = 0; k < labels.length; k++) {
    byPosition[labels[k]!].push(field[k] ?? 0);
  }
  const summarize = (position: ProbePosition): PositionGroup => {
    const values = byPosition[position];
    return {
      position,
      count: values.length,
      meanMt: mean(values),
      stdMt: sampleStd(values),
      meanAbsMt: mean(values.map(Math.abs)),
    };
  };
  return {
    center: summarize("center"),
    end: summarize("end"),
    outside: summarize("outside"),
  };
}

export interface DirectSummary {
  groups: Record<ProbePosition, PositionGroup>;
  /** {@link PositionGroup.meanAbsMt} for "end" over "center" — theory ≈ 0.5. */
  endToCenterRatio: number;
}

export function summarizeDirect(
  field: Float64Array = directFieldMt,
  labels: ProbePosition[] = POSITION_LABELS,
): DirectSummary {
  const groups = groupByPosition(field, labels);
  return {
    groups,
    endToCenterRatio: groups.end.meanAbsMt / groups.center.meanAbsMt,
  };
}
