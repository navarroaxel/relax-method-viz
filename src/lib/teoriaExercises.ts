/** Cálculos de los ejercicios del 2P (SI). Ver src/app/magnetismo-ejercicios. */

export const MU0 = 4 * Math.PI * 1e-7;
export const EPS0 = 8.854187817e-12;
export const C0 = 1 / Math.sqrt(MU0 * EPS0);

/** Corriente en dos bobinas de N espiras, radio R, separadas R, para B en el punto medio. */
export function helmholtzCurrent(
  bTesla: number,
  radiusM: number,
  turns: number,
): number {
  return (bTesla * radiusM) / (MU0 * turns * (4 / 5) ** 1.5);
}

/** σ/(ωε) con ε = ε_r·ε₀. */
export function lossRatio(sigma: number, freqHz: number, epsR = 1): number {
  return sigma / (2 * Math.PI * freqHz * epsR * EPS0);
}

/** Buen conductor: α = β = √(ωμσ/2). */
export function alphaGoodConductor(sigma: number, freqHz: number): number {
  return Math.sqrt((2 * Math.PI * freqHz * MU0 * sigma) / 2);
}

/** σ a partir de la profundidad de penetración δ = 1/α (buen conductor). */
export function conductivityFromDepth(deltaM: number, freqHz: number): number {
  return 1 / (Math.PI * freqHz * MU0 * deltaM * deltaM);
}

/** α exacto de una onda plana en un medio con pérdidas (μ₀, ε₀, σ). */
export function alphaExact(sigma: number, freqHz: number): number {
  const w = 2 * Math.PI * freqHz;
  const r = lossRatio(sigma, freqHz);
  return w * Math.sqrt((MU0 * EPS0) / 2) * Math.sqrt(Math.sqrt(1 + r * r) - 1);
}

/** Distancia para que la amplitud caiga `percent` % (99 → queda 1 %). */
export function attenuationDistance(alpha: number, percent: number): number {
  return Math.log(100 / (100 - percent)) / alpha;
}

export interface LoopGeometry {
  currentA: number;
  lengthM: number;
  gapM: number;
  heightM: number;
  distanceM: number;
}

/** Fuerza neta (hacia el conductor) sobre la espira semi-rectangular. */
export function loopNetForce(g: LoopGeometry): number {
  const { currentA: i, lengthM: l, gapM: a, heightM: h, distanceM: d } = g;
  return ((MU0 * i * i) / (2 * Math.PI)) * (l / d - (l - a) / (d + h));
}

/** Inductancia mutua hilo recto – espira rectangular coplanar. */
export function wireLoopMutual(hM: number, wM: number, dM: number): number {
  return ((MU0 * hM) / (2 * Math.PI)) * Math.log((dM + wM) / dM);
}

export function planeWaveInVacuum(eMax: number, freqHz: number) {
  const omega = 2 * Math.PI * freqHz;
  const beta = omega * Math.sqrt(MU0 * EPS0);
  const eta = Math.sqrt(MU0 / EPS0);
  const hMax = eMax / eta;
  return { omega, beta, eta, hMax, bMax: MU0 * hMax };
}

/** B de un conductor recto finito (longitud L) a distancia r del centro, sobre la mediatriz. */
export function finiteWireField(currentA: number, lengthM: number, rM: number) {
  const bInf = (MU0 * currentA) / (2 * Math.PI * rM);
  const b = bInf * (lengthM / Math.sqrt(lengthM * lengthM + 4 * rM * rM));
  return { b, bInf, errPct: ((bInf - b) / b) * 100 };
}

export function parallelWireForcePerLength(
  currentA: number,
  distM: number,
): number {
  return (MU0 * currentA * currentA) / (2 * Math.PI * distM);
}

/** Inductancia interna por unidad de longitud de un conductor tubular (radios a < b). */
export function tubularInternalInductance(
  aM: number,
  bM: number,
  mu = MU0,
): number {
  const d = bM * bM - aM * aM;
  return (
    (mu * (bM * bM - 3 * aM * aM)) / (8 * Math.PI * d) +
    (mu * aM ** 4 * Math.log(bM / aM)) / (2 * Math.PI * d * d)
  );
}

// ---- Guía de ejercicios (25 en adelante) ----

/** B de un conductor macizo de radio b a distancia r del eje (dentro y fuera). */
export function solidWireField(
  currentA: number,
  bM: number,
  rM: number,
): number {
  return rM <= bM
    ? (MU0 * currentA * rM) / (2 * Math.PI * bM * bM)
    : (MU0 * currentA) / (2 * Math.PI * rM);
}

/** B dentro de un toroide (a < r < b). */
export function toroidField(
  turns: number,
  currentA: number,
  rM: number,
): number {
  return (MU0 * turns * currentA) / (2 * Math.PI * rM);
}

/** Tubo delgado con corriente superficial: 0 adentro, μ₀I/2πr afuera. */
export function thinTubeField(
  currentA: number,
  bM: number,
  rM: number,
): number {
  return rM < bM ? 0 : (MU0 * currentA) / (2 * Math.PI * rM);
}

export function solenoidField(turnsPerM: number, currentA: number): number {
  return MU0 * turnsPerM * currentA;
}

export function squareLoopCenterField(currentA: number, sideM: number): number {
  return (2 * Math.SQRT2 * MU0 * currentA) / (Math.PI * sideM);
}

export function circularLoopAxisField(
  currentA: number,
  bM: number,
  zM: number,
): number {
  return (MU0 * currentA * bM * bM) / (2 * (bM * bM + zM * zM) ** 1.5);
}

/** Toroide de sección rectangular (alto h, radios a < b). */
export function toroidInductance(
  turns: number,
  hM: number,
  aM: number,
  bM: number,
): number {
  return ((MU0 * hM * turns * turns) / (2 * Math.PI)) * Math.log(bM / aM);
}

/** Solenoide largo: L/l = μ n² π r². */
export function solenoidInductancePerLength(
  turnsPerM: number,
  rM: number,
  mu = MU0,
): number {
  return mu * turnsPerM * turnsPerM * Math.PI * rM * rM;
}

/** Coaxial con conductor interno macizo (a) y externo delgado (b). */
export function coaxInductancePerLength(aM: number, bM: number): number {
  return MU0 / (8 * Math.PI) + (MU0 / (2 * Math.PI)) * Math.log(bM / aM);
}

/** Línea de dos alambres (radio a, ejes a distancia d ≫ a): interna y externa. */
export function twoWireInductancePerLength(aM: number, dM: number) {
  const internal = MU0 / (4 * Math.PI);
  const external = (MU0 / Math.PI) * Math.log((dM - aM) / aM);
  return { internal, external, total: internal + external };
}

/** Par sobre una espira rectangular b₁×b₂ en el plano xy dentro de B uniforme (la fuerza neta es 0). */
export function loopTorque(
  currentA: number,
  b1M: number,
  b2M: number,
  bx: number,
  by: number,
) {
  const m = currentA * b1M * b2M;
  return { tx: -m * by, ty: m * bx };
}

export function displacementCurrentAmplitude(
  capF: number,
  v0: number,
  omega: number,
): number {
  return capF * omega * v0;
}

/** Vector de Poynting en el dieléctrico de un coaxial en continua (r entre a y b). */
export function coaxPoynting(
  v: number,
  currentA: number,
  aM: number,
  bM: number,
  rM: number,
): number {
  return (v * currentA) / (2 * Math.PI * rM * rM * Math.log(bM / aM));
}

/** Número con 3 cifras significativas, listo para TeX. */
export function texNum(x: number, sig = 3): string {
  if (x === 0) return "0";
  const exp = Math.floor(Math.log10(Math.abs(x)));
  if (exp >= -3 && exp <= 4) return String(Number(x.toPrecision(sig)));
  const mant = Number((x / 10 ** exp).toPrecision(sig));
  return `${mant}\\times10^{${exp}}`;
}

/** Acepta coma decimal y notación científica; null si no es un número. */
export function parseNumber(input: string): number | null {
  const s = input.trim().replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export interface Expected {
  value: number;
  /** Otro resultado aceptado (p. ej. con una aproximación distinta). */
  alt?: number;
  relTol?: number;
  absTol?: number;
}

export function checkAnswer(input: string, e: Expected): boolean {
  const n = parseNumber(input);
  if (n === null) return false;
  const rel = e.relTol ?? 0.03;
  const abs = e.absTol ?? 0;
  const ok = (v: number) => Math.abs(n - v) <= Math.max(abs, rel * Math.abs(v));
  return ok(e.value) || (e.alt !== undefined && ok(e.alt));
}
