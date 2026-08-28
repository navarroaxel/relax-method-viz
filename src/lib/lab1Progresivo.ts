/**
 * Laboratorio 1 — the "progresivo" sheet of lab1.xlsx: 201 samples at 100 ms
 * over 20 s, logged by CASSY while the loop current was swept by hand with
 * the supply knob. Unlike the escalón capture, this is the actual F-vs-I
 * measurement the report asks for — and because the knob goes up and then
 * back down, the record contains both branches of the sweep, which is what
 * makes the force sensor's lag show up as hysteresis.
 */

/** Sampling interval of the capture, in seconds. */
export const PROGRESIVO_DT_S = 0.1;

const FORCE_MN_CSV =
  "0.05,0.05,0.07,0.1,0.1,0.1,0.13,0.18,0.21,0.23,0.25,0.29,0.32,0.33," +
  "0.37,0.38,0.38,0.41,0.45,0.48,0.49,0.53,0.56,0.56,0.57,0.61,0.64,0.67," +
  "0.66,0.67,0.68,0.7,0.72,0.73,0.74,0.76,0.79,0.82,0.86,0.91,0.95,1.03," +
  "1.08,1.1,1.14,1.15,1.18,1.2,1.23,1.27,1.3,1.33,1.34,1.38,1.42,1.42," +
  "1.46,1.47,1.44,1.47,1.51,1.52,1.52,1.55,1.56,1.59,1.64,1.67,1.71,1.74," +
  "1.75,1.79,1.81,1.82,1.82,1.82,1.83,1.86,1.88,1.9,1.94,1.98,1.99,1.99," +
  "2.02,2.07,2.06,2.04,2.04,2.03,2.06,2.1,2.13,2.16,2.17,2.17,2.19,2.21," +
  "2.21,2.25,2.28,2.28,2.34,2.35,2.36,2.37,2.4,2.4,2.4,2.42,2.43,2.44," +
  "2.47,2.48,2.51,2.55,2.56,2.59,2.58,2.56,2.58,2.54,2.5,2.49,2.49,2.49," +
  "2.49,2.47,2.47,2.47,2.47,2.49,2.47,2.45,2.47,2.45,2.44,2.4,2.4,2.36," +
  "2.34,2.36,2.35,2.35,2.33,2.3,2.29,2.27,2.27,2.23,2.22,2.23,2.22,2.23," +
  "2.22,2.23,2.22,2.19,2.17,2.13,2.15,2.1,2.1,2.08,2.06,2.06,2.05,2.02," +
  "2.02,2,2,1.97,1.94,1.92,1.92,1.92,1.91,1.88,1.86,1.83,1.82,1.82,1.84," +
  "1.81,1.79,1.78,1.75,1.76,1.74,1.72,1.69,1.69,1.68,1.66,1.65,1.65,1.65," +
  "1.64,1.66,1.66,1.68";

const CURRENT_A_CSV =
  "1.03,1.22,1.32,1.4,1.56,1.56,1.83,2.01,2.16,2.27,2.42,2.61,2.73,3,3.17," +
  "3.25,3.44,3.61,3.77,3.94,4.16,4.29,4.56,4.82,5.04,5.17,5.4,5.61,5.81," +
  "6.02,6.21,6.36,6.53,6.63,6.9,7.11,7.37,7.76,8.07,8.38,8.83,9.19,9.44," +
  "9.63,9.82,10.02,10.26,10.44,10.65,10.86,11.05,11.23,11.36,11.49,11.64," +
  "11.84,12.02,12.16,12.3,12.3,12.46,12.58,12.67,12.73,12.84,12.99,13.26," +
  "13.52,13.67,13.86,14,14.16,14.4,14.55,14.64,14.71,14.8,15.15,15.43," +
  "15.6,15.76,15.91,15.93,16.13,16.3,16.39,16.46,16.59,16.8,17.06,17.16," +
  "17.33,17.57,17.72,17.84,17.91,18,18.15,18.27,18.47,18.62,18.75,18.86," +
  "18.93,18.98,18.99,19.08,19.2,19.25,19.43,19.71,19.83,19.83,19.96,20.1," +
  "20.14,20.32,20.36,20.36,20.25,19.95,19.56,19.46,19.38,19.35,19.29," +
  "19.18,19.16,19.09,19.04,19.02,18.99,18.96,18.91,18.81,18.77,18.72,18.6," +
  "18.47,18.36,18.23,18.15,18.06,17.97,17.9,17.82,17.73,17.57,17.49,17.4," +
  "17.3,17.19,17.15,17.1,17.07,16.95,16.82,16.74,16.7,16.61,16.47,16.41," +
  "16.37,16.29,16.19,16.19,16.11,15.91,15.84,15.69,15.61,15.57,15.45,15.4," +
  "15.31,15.24,15.12,14.95,14.82,14.76,14.68,14.63,14.53,14.47,14.38," +
  "14.31,14.25,14.16,14.07,13.96,13.86,13.77,13.62,13.52,13.46,13.37,13.3," +
  "13.21,13.14,13.06,12.97";

function parseCsv(csv: string): Float64Array {
  const parts = csv.split(",");
  const out = new Float64Array(parts.length);
  for (let k = 0; k < parts.length; k++) out[k] = Number(parts[k]);
  return out;
}

/** Force channel F_A1, in mN, one sample every {@link PROGRESIVO_DT_S}. */
export const progresivoForceMn: Float64Array = parseCsv(FORCE_MN_CSV);

/** Current channel I_B1, in A, sampled alongside {@link progresivoForceMn}. */
export const progresivoCurrentA: Float64Array = parseCsv(CURRENT_A_CSV);

/** Sample index -> time in seconds. */
export function progresivoTime(index: number): number {
  return index * PROGRESIVO_DT_S;
}

export interface LineFit {
  /** Slope of F against I, in mN/A. */
  slopeMnPerA: number;
  /** Intercept, in mN. A non-zero value is residual tare on the sensor. */
  interceptMn: number;
  /** Coefficient of determination. */
  r2: number;
  /** Field implied by the slope, B = slope / l, in mT. */
  fieldMt: number;
}

/**
 * Least squares of F against I over `indices`, plus the field the slope
 * implies. F in mN and B in mT share the 1e-3 factor, so B = slope / l.
 */
export function fitLine(
  force: Float64Array,
  current: Float64Array,
  indices: number[],
  loopLengthM: number,
): LineFit {
  const n = indices.length;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (const k of indices) {
    const x = current[k] ?? 0;
    const y = force[k] ?? 0;
    sx += x;
    sy += y;
    sxx += x * x;
    sxy += x * y;
  }
  const denom = n * sxx - sx * sx;
  const slopeMnPerA = denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
  const interceptMn = (sy - slopeMnPerA * sx) / n;

  const meanY = sy / n;
  let ssTot = 0;
  let ssRes = 0;
  for (const k of indices) {
    const y = force[k] ?? 0;
    const pred = slopeMnPerA * (current[k] ?? 0) + interceptMn;
    ssTot += (y - meanY) * (y - meanY);
    ssRes += (y - pred) * (y - pred);
  }

  return {
    slopeMnPerA,
    interceptMn,
    r2: ssTot === 0 ? 0 : 1 - ssRes / ssTot,
    fieldMt: slopeMnPerA / loopLengthM,
  };
}

/**
 * Whole-sample delay that best aligns F with I: the shift k minimising the
 * residual of F[j] against I[j-k]. The sensor lags, so a positive result is
 * expected — and it should agree with the escalón capture's timing.
 */
export function bestLagSamples(
  force: Float64Array,
  current: Float64Array,
  maxLag: number,
  loopLengthM: number,
): { lagSamples: number; lagS: number; fit: LineFit } {
  let best = { lagSamples: 0, lagS: 0, fit: fitLine(force, current, [], 1) };
  let bestErr = Infinity;
  for (let lag = 0; lag <= maxLag; lag++) {
    const shifted = new Float64Array(force.length - lag);
    const kept = new Float64Array(force.length - lag);
    for (let j = lag; j < force.length; j++) {
      shifted[j - lag] = current[j - lag] ?? 0;
      kept[j - lag] = force[j] ?? 0;
    }
    const indices = Array.from({ length: kept.length }, (_, k) => k);
    const fit = fitLine(kept, shifted, indices, loopLengthM);
    let err = 0;
    for (const k of indices) {
      const pred = fit.slopeMnPerA * (shifted[k] ?? 0) + fit.interceptMn;
      const d = (kept[k] ?? 0) - pred;
      err += d * d;
    }
    if (err < bestErr) {
      bestErr = err;
      best = { lagSamples: lag, lagS: lag * PROGRESIVO_DT_S, fit };
    }
  }
  return best;
}

export interface RampAnalysis {
  /** Index, time and value of the current peak: where the knob turned back. */
  peakIndex: number;
  peakTimeS: number;
  peakCurrentA: number;
  /** Current at the start and end of the record, in A. */
  startCurrentA: number;
  endCurrentA: number;
  /** Largest |dI/dt| the hand managed, in A/s. */
  maxRateAPerS: number;
  /** Fits over the whole record and over each branch of the sweep. */
  overall: LineFit;
  rising: LineFit;
  falling: LineFit;
  /** Spread between the two branches, as a percentage of their mean. */
  hysteresisPct: number;
  /** Delay that best aligns force with current, in seconds. */
  bestLagS: number;
}

/**
 * Figures of merit of the hand-swept ramp. `force` is in mN and `current` in
 * A, both sampled at {@link PROGRESIVO_DT_S}.
 */
export function analyzeRamp(
  force: Float64Array,
  current: Float64Array,
  loopLengthM: number,
): RampAnalysis {
  const n = force.length;

  let peakIndex = 0;
  for (let k = 1; k < n; k++) {
    if ((current[k] ?? 0) > (current[peakIndex] ?? 0)) peakIndex = k;
  }

  let maxRateAPerS = 0;
  for (let k = 1; k < n; k++) {
    const rate =
      Math.abs((current[k] ?? 0) - (current[k - 1] ?? 0)) / PROGRESIVO_DT_S;
    if (rate > maxRateAPerS) maxRateAPerS = rate;
  }

  const all = Array.from({ length: n }, (_, k) => k);
  const up = all.slice(0, peakIndex + 1);
  const down = all.slice(peakIndex);

  const overall = fitLine(force, current, all, loopLengthM);
  const rising = fitLine(force, current, up, loopLengthM);
  const falling = fitLine(force, current, down, loopLengthM);
  const mean = (rising.fieldMt + falling.fieldMt) / 2;

  return {
    peakIndex,
    peakTimeS: progresivoTime(peakIndex),
    peakCurrentA: current[peakIndex] ?? 0,
    startCurrentA: current[0] ?? 0,
    endCurrentA: current[n - 1] ?? 0,
    maxRateAPerS,
    overall,
    rising,
    falling,
    hysteresisPct:
      mean === 0 ? 0 : ((falling.fieldMt - rising.fieldMt) / mean) * 100,
    bestLagS: bestLagSamples(force, current, 5, loopLengthM).lagS,
  };
}

/**
 * What the escalón's own sensor would have reported for this current sweep.
 *
 * The step record *is* the sensor's step response, so superposing a scaled,
 * shifted copy of it for every increment of the input reproduces the output
 * without assuming any model — no damping ratio, no natural frequency. The
 * result is per-amp: multiply by the measured gain to get mN.
 *
 * Only the sweep's own sample times are evaluated, and increments older than
 * the step record has memory for have already settled to unit gain, so this
 * costs `current.length × stepResponse.length` rather than the full
 * fine-grid convolution.
 */
export function predictFromStepResponse(
  current: Float64Array,
  stepResponse: Float64Array,
  stepSteadyMn: number,
  oversample: number,
): Float64Array {
  const n = current.length;
  const memory = stepResponse.length;
  const fineCount = (n - 1) * oversample + 1;

  // The sweep is sampled far more coarsely than the step response, so
  // interpolate it up to the step record's grid before superposing.
  const fine = new Float64Array(fineCount);
  for (let k = 0; k < fineCount; k++) {
    const x = k / oversample;
    const j = Math.floor(x);
    const frac = x - j;
    const a = current[j] ?? 0;
    const b = current[Math.min(j + 1, n - 1)] ?? 0;
    fine[k] = a * (1 - frac) + b * frac;
  }

  const normalised = (k: number) =>
    stepSteadyMn === 0 ? 0 : (stepResponse[k] ?? 0) / stepSteadyMn;

  const out = new Float64Array(n);
  for (let k = 0; k < n; k++) {
    const t = k * oversample;
    const from = Math.max(1, t - memory + 1);
    // Everything older than the memory window has reached unit gain, which
    // sums to exactly the input value at the edge of that window.
    let acc = t >= memory ? (fine[t - memory] ?? 0) : (fine[0] ?? 0);
    for (let j = from; j <= t; j++) {
      acc += ((fine[j] ?? 0) - (fine[j - 1] ?? 0)) * normalised(t - j);
    }
    out[k] = acc;
  }
  return out;
}

/**
 * Vertical gap between the two branches of the sweep, in the units of
 * `values`. Both branches are fitted over the current window they share —
 * the down leg covers less ground than the up leg, and comparing fits over
 * different spans would not be comparing like with like.
 */
export function branchGap(
  values: Float64Array,
  current: Float64Array,
  splitIndex: number,
): { atCurrentA: number; gapMn: number } {
  const n = values.length;
  let lo = Infinity;
  let hi = -Infinity;
  for (let k = splitIndex; k < n; k++) {
    const v = current[k] ?? 0;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const inWindow = (k: number) =>
    (current[k] ?? 0) >= lo && (current[k] ?? 0) <= hi;
  const up: number[] = [];
  for (let k = 0; k <= splitIndex; k++) if (inWindow(k)) up.push(k);
  const down: number[] = [];
  for (let k = splitIndex; k < n; k++) down.push(k);

  const mid = (lo + hi) / 2;
  const fitUp = fitLine(values, current, up, 1);
  const fitDown = fitLine(values, current, down, 1);
  const at = (f: LineFit) => f.slopeMnPerA * mid + f.interceptMn;
  return { atCurrentA: mid, gapMn: at(fitDown) - at(fitUp) };
}
