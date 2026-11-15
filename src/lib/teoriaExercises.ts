/** Cálculos de los ejercicios del 2P (SI). Ver src/app/ejercicios. */

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
export function alphaExact(sigma: number, freqHz: number, epsR = 1): number {
  const w = 2 * Math.PI * freqHz;
  const r = lossRatio(sigma, freqHz, epsR);
  return (
    w * Math.sqrt((MU0 * EPS0 * epsR) / 2) * Math.sqrt(Math.sqrt(1 + r * r) - 1)
  );
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

// ---- Guía de ejercicios (24 en adelante) ----

/** Cable de radio a con una sola capa de aislante (ε_r) hasta la pantalla b: E máx. en r = a. */
export function cableSingleLayer(
  aM: number,
  bM: number,
  emaxVPerM: number,
  epsR = 1,
) {
  return {
    vmax: emaxVPerM * aM * Math.log(bM / aM),
    cPerM: (2 * Math.PI * EPS0 * epsR) / Math.log(bM / aM),
  };
}

/**
 * Aislante en tres capas (ε_r de adentro hacia afuera) ajustadas para que E valga
 * E máx. al comienzo de cada capa: r₁ = a·ε₁/ε₂, r₂ = r₁·ε₂/ε₃.
 */
export function cableMultiLayer(
  aM: number,
  bM: number,
  emaxVPerM: number,
  epsR: readonly [number, number, number],
) {
  const [e1, e2, e3] = epsR;
  const r1 = (aM * e1) / e2;
  const r2 = (r1 * e2) / e3;
  const k = emaxVPerM * e1 * aM; // ρ/(2π ε₀)
  const vmax =
    k *
    (Math.log(r1 / aM) / e1 + Math.log(r2 / r1) / e2 + Math.log(bM / r2) / e3);
  return { r1, r2, vmax, cPerM: (2 * Math.PI * EPS0 * k) / vmax };
}

/** E(r) del cable de tres capas (V/m); 0 fuera de [a, b]. */
export function cableMultiLayerField(
  rM: number,
  aM: number,
  bM: number,
  emaxVPerM: number,
  epsR: readonly [number, number, number],
): number {
  const { r1, r2 } = cableMultiLayer(aM, bM, emaxVPerM, epsR);
  if (rM < aM || rM > bM) return 0;
  const k = emaxVPerM * epsR[0] * aM;
  const eps = rM <= r1 ? epsR[0] : rM <= r2 ? epsR[1] : epsR[2];
  return k / (eps * rM);
}

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

// ---- Guía de ejercicios (1 al 24) ----

export const planeCharge = (rhoS: number) => rhoS / (2 * EPS0);

/** |E| de una esfera con densidad volumétrica uniforme ρ₀ (radio b) a distancia r. */
export function uniformSphereField(rho0: number, bM: number, rM: number) {
  return rM <= bM
    ? (rho0 * rM) / (3 * EPS0)
    : (rho0 * bM ** 3) / (3 * EPS0 * rM * rM);
}

/** |E| de una capa esférica delgada con carga Q (0 adentro). */
export const shellField = (q: number, bM: number, rM: number) =>
  rM < bM ? 0 : q / (4 * Math.PI * EPS0 * rM * rM);

/** E sobre el eje de un disco de radio b con densidad ρs, a distancia z > 0. */
export const diskAxisField = (rhoS: number, bM: number, zM: number) =>
  (rhoS / (2 * EPS0)) * (1 - zM / Math.hypot(bM, zM));

/** Carga puntual Q en el centro de una capa conductora (radios Ri < R0): E y V a distancia r. */
export function pointInShell(q: number, riM: number, r0M: number, rM: number) {
  const k = q / (4 * Math.PI * EPS0);
  if (rM > r0M) return { e: k / (rM * rM), v: k / rM };
  if (rM >= riM) return { e: 0, v: k / r0M };
  return { e: k / (rM * rM), v: k * (1 / rM - 1 / riM + 1 / r0M) };
}

/** Dos esferas conectadas (b₁ < b₂) con carga total Q. */
export function connectedSpheres(q: number, b1M: number, b2M: number) {
  const q1 = (q * b1M) / (b1M + b2M);
  const q2 = (q * b2M) / (b1M + b2M);
  return {
    q1,
    q2,
    e1: q1 / (4 * Math.PI * EPS0 * b1M * b1M),
    e2: q2 / (4 * Math.PI * EPS0 * b2M * b2M),
  };
}

export const plateCapacitance = (epsR: number, sM2: number, dM: number) =>
  (epsR * EPS0 * sM2) / dM;

export const cylCapacitance = (
  epsR: number,
  aM: number,
  bM: number,
  lM: number,
) => (2 * Math.PI * epsR * EPS0 * lM) / Math.log(bM / aM);

/** Fuerza de atracción entre placas con carga Q constante (no depende de la separación). */
export const plateForce = (q: number, sM2: number) =>
  (q * q) / (2 * EPS0 * sM2);

/** V(r) y E(r) entre los conductores de un coaxial (V₀ en r = a, 0 en r = b). */
export function coaxPotential(v0: number, aM: number, bM: number, rM: number) {
  return {
    v: (v0 * Math.log(rM / bM)) / Math.log(aM / bM),
    e: v0 / (rM * Math.log(bM / aM)),
  };
}

/** Potencial entre dos planos en cuña (0 en φ=0 y φ=2π, V₀ en φ=α). */
export function wedgePotential(v0: number, alphaRad: number, phi: number) {
  return phi <= alphaRad
    ? (v0 * phi) / alphaRad
    : (v0 * (2 * Math.PI - phi)) / (2 * Math.PI - alphaRad);
}

/** V(r) y E(r) entre dos capas esféricas (V₁ en Ri, V₂ en R0). */
export function sphericalShellPotential(
  v1: number,
  v2: number,
  riM: number,
  r0M: number,
  rM: number,
) {
  const a = (v1 - v2) / (1 / riM - 1 / r0M);
  return { v: v2 + a * (1 / rM - 1 / r0M), e: a / (rM * rM) };
}

/** Capacidad por metro de una línea (radio a) a altura h sobre tierra. */
export const lineOverGroundC = (hM: number, aM: number) =>
  (2 * Math.PI * EPS0) / Math.log((2 * hM) / aM);

export const relaxationTime = (epsR: number, sigma: number) =>
  (epsR * EPS0) / sigma;

/** Resistencia de fuga de un tramo l de coaxial con aislante de conductividad σ. */
export const coaxLeakResistance = (
  aM: number,
  bM: number,
  lM: number,
  sigma: number,
) => Math.log(bM / aM) / (2 * Math.PI * lM * sigma);

/** Línea de dos alambres (radio a, ejes a distancia d): C' y resistencia de fuga por unidad de longitud. */
export function twoWireLeak(aM: number, dM: number, sigma: number, epsR = 1) {
  const eps = epsR * EPS0;
  const ln = Math.log((dM - aM) / aM);
  return { cPerM: (Math.PI * eps) / ln, rLeak: ln / (sigma * Math.PI) };
}

/** Cuarto de arandela (grosor h, radios a < b): resistencia entre las caras de los extremos. */
export const quarterWasherResistance = (
  sigma: number,
  hM: number,
  aM: number,
  bM: number,
) => Math.PI / (2 * sigma * hM * Math.log(bM / aM));

/** Línea L a altura h protegida por un hilo M (radio a) a m por encima, bajo campo E₀. */
export function stormLine(hM: number, mM: number, aM: number, e0: number) {
  const top = hM + mM;
  const k = (-top * e0) / Math.log((2 * top) / aM); // ρ/(2πε₀)
  const vBefore = hM * e0;
  const vFromM = k * Math.log((2 * hM + mM) / mM);
  return {
    k,
    vBefore,
    vAfter: vBefore + vFromM,
    eM: k / aM + e0,
  };
}

/** Potencial a distancia d de una toma de tierra semiesférica que drena I en suelo de conductividad σ. */
export const groundVoltage = (iA: number, sigma: number, dM: number) =>
  iA / (2 * Math.PI * sigma * dM);

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
