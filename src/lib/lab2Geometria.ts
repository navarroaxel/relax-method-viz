/**
 * Laboratorio 2 — "Medición de la permeabilidad del vacío" (UTN.BA, Teoría de
 * los Campos, GL-950526-3).
 *
 * Everything geometric the experiment needs, and the two ways of turning a
 * measured F-vs-I curve into μ₀.
 *
 * The guide models the setup as two straight, infinitely long parallel
 * conductors a distance r apart:
 *
 *     F = μ₀ I² l / (2π r)      ⇒      μ₀ = 2π F r / (I² l)
 *
 * The bench is not quite that. The lower conductor, on the height-adjustable
 * holder, really is a single straight rod — its own return is routed away
 * from the interaction zone and does not measurably pull or push back. The
 * *suspended* conductor is the one that is not lone: it is the near side of a
 * closed rectangular loop hanging from the force sensor, and its far side
 * carries the same current back the other way, close enough to matter. The
 * guide's own Nota (§4.2) points at exactly this and asks whether the effect
 * can be dropped. It cannot: see {@link geometryFactor}.
 */

/** Accepted value of the vacuum permeability, in H/m (guide §4.2). */
export const MU0_ACCEPTED = 1.2566370617e-6;

// ---------------------------------------------------------------------------
// Measurements taken on the bench (hand notes of the practice day)
// ---------------------------------------------------------------------------

/** Length of the lower straight conductor (conductor I), in metres. */
export const LOWER_LENGTH_M = 0.342;
/** Length of the suspended conductor carrying the sensor (conductor II). */
export const UPPER_LENGTH_M = 0.302;
/**
 * Length used in the force formula, in metres. The force is only measured on
 * the suspended loop, so l is *its* side — the shorter of the two. The lower
 * conductor being longer is what makes the "infinitely long" idealisation
 * defensible over that span, not a second length to average in.
 */
export const FORCE_LENGTH_M = UPPER_LENGTH_M;
/** Error on the lengths, in metres — steel rule read to the millimetre. */
export const LENGTH_ERROR_M = 0.001;

/** Wire diameter of conductor I, in metres — micrometer. */
export const LOWER_DIAMETER_M = 0.001965;
/** Wire diameter of conductor II, in metres — micrometer. */
export const UPPER_DIAMETER_M = 0.00203;
/**
 * Mean wire diameter, in metres. Centre-to-centre distance between two wires
 * separated by a clear gap g is g + d₁/2 + d₂/2 = g + this.
 */
export const MEAN_DIAMETER_M = (LOWER_DIAMETER_M + UPPER_DIAMETER_M) / 2;

/**
 * Clear gap set between the facing wire surfaces, in metres — the "r = 1 mm"
 * of the hand notes. The guide (§2.3) calls for a few millimetres; the two
 * loops just touching is r = 2 mm, so a 1 mm gap is one wire-diameter above
 * contact.
 */
export const SURFACE_GAP_M = 0.001;

/**
 * Separation r between the two conductors, in metres: centre to centre, so
 * the clear gap plus one mean diameter. This is the r of the guide's formula
 * and, as {@link errorTerms} shows, the measurement that dominates Δμ₀.
 */
export const SEPARATION_M = SURFACE_GAP_M + MEAN_DIAMETER_M;

/**
 * Error on {@link SEPARATION_M}, in metres. The diameters are micrometer
 * readings (±5 µm, negligible here); the gap was set by eye against the
 * caliper scale after bringing the loops into contact, which is worth about
 * a tenth of a millimetre — and that single tenth is 3 % of r.
 */
export const SEPARATION_ERROR_M = 0.0001;

/**
 * Height of the suspended loop, in metres: the distance from its lower
 * (force-carrying) side up to its return side. Measured outside-to-outside
 * with the caliper at 60.1 mm, so one diameter comes off to get centre to
 * centre.
 */
export const UPPER_LOOP_HEIGHT_M = 0.0601 - MEAN_DIAMETER_M;

/** Instrument error on the CASSY current channel I_B1, in A (30 A unit). */
export const CURRENT_ERROR_A = 0.05;
/** Instrument error on the CASSY force channel F_A1, in mN. */
export const FORCE_ERROR_MN = 0.05;

// ---------------------------------------------------------------------------
// The four-conductor correction
// ---------------------------------------------------------------------------

export interface GeometryFactor {
  /** Σ ±1/dᵢ over the wire pairs that matter, in 1/m. */
  factorPerM: number;
  /** The idealised two-wire value 1/r it replaces, in 1/m. */
  idealPerM: number;
  /** factorPerM / idealPerM — how much of the ideal force actually survives. */
  ratio: number;
  /** (1 − ratio)·100: the systematic shortfall of the ideal model, in %. */
  shortfallPct: number;
}

/**
 * The geometric sum that replaces 1/r once the suspended conductor is
 * recognised as one side of a loop rather than a lone infinite wire.
 *
 * Three wires carry the same I: the lower conductor (a single straight rod,
 * its own return too far away to matter), and the suspended loop's two
 * sides. Taking downward force as positive:
 *
 *   - lower conductor ↔ suspended near side, distance r, currents parallel
 *     → +1/r
 *   - lower conductor ↔ suspended return side, distance r + h_up,
 *     antiparallel → −1/(r + h_up)
 *
 * so F = μ₀ I² l / (2π) · factorPerM. With the measured height this shaves a
 * few percent off the force the ideal pair would give — enough to matter
 * next to the instrument errors in {@link errorTerms}, which is the answer to
 * the guide's Nota: the effect cannot be dropped, even though only one of the
 * two conductors is actually a loop.
 */
export function geometryFactor(
  separationM = SEPARATION_M,
  upperHeightM = UPPER_LOOP_HEIGHT_M,
): GeometryFactor {
  const idealPerM = 1 / separationM;
  const factorPerM = idealPerM - 1 / (separationM + upperHeightM);
  const ratio = factorPerM / idealPerM;
  return {
    factorPerM,
    idealPerM,
    ratio,
    shortfallPct: (1 - ratio) * 100,
  };
}

// ---------------------------------------------------------------------------
// Slope → μ₀
// ---------------------------------------------------------------------------

/**
 * μ₀ from the slope a of F = a·I², with F in mN and I in A — the shape every
 * measurement in this lab reduces to.
 *
 * Ideal two-wire model: a[N/A²] = μ₀ l / (2π r), so μ₀ = 2π r a / l.
 */
export function mu0FromSlopeIdeal(
  slopeMnPerA2: number,
  separationM = SEPARATION_M,
  lengthM = FORCE_LENGTH_M,
): number {
  return (2 * Math.PI * separationM * slopeMnPerA2 * 1e-3) / lengthM;
}

/**
 * μ₀ from the same slope with the loop return conductors kept in: the ideal
 * 1/r is replaced by {@link geometryFactor}'s sum, so
 * μ₀ = 2π a / (l · factorPerM).
 */
export function mu0FromSlopeCorrected(
  slopeMnPerA2: number,
  factor = geometryFactor(),
  lengthM = FORCE_LENGTH_M,
): number {
  return (2 * Math.PI * slopeMnPerA2 * 1e-3) / (lengthM * factor.factorPerM);
}

// ---------------------------------------------------------------------------
// Error propagation — guide §2.2
// ---------------------------------------------------------------------------

export interface ErrorTerms {
  /** |∂μ₀/∂I|·ΔI, in H/m. */
  fromCurrent: number;
  /** |∂μ₀/∂l|·Δl, in H/m. */
  fromLength: number;
  /** |∂μ₀/∂F|·ΔF, in H/m. */
  fromForce: number;
  /** |∂μ₀/∂r|·Δr, in H/m. */
  fromSeparation: number;
  /** Sum of the four, the guide's Δμ₀, in H/m. */
  totalAbs: number;
  /** μ₀ at this operating point, in H/m. */
  mu0: number;
  /** Δμ₀ / μ₀, in %. */
  relativePct: number;
  /** Which single term is largest. */
  dominant: "current" | "length" | "force" | "separation";
}

/**
 * The guide's absolute error at one operating point (I, F), evaluated exactly
 * as §2.2 writes it — a sum of absolute partials, not a quadrature sum:
 *
 *   Δμ₀ = 4πFr/(I³l)·ΔI + 2πFr/(I²l²)·Δl + 2πr/(I²l)·ΔF + 2πF/(I²l)·Δr
 *
 * Dividing through by μ₀ = 2πFr/(I²l) collapses it to
 * Δμ₀/μ₀ = 2ΔI/I + Δl/l + ΔF/F + Δr/r, which is the useful form: every term
 * is a relative error, so "which one hurts most" is just "which quantity is
 * known worst in relative terms". F is measured in mN, so ΔF must be too.
 */
export function errorTerms(
  currentA: number,
  forceMn: number,
  separationM = SEPARATION_M,
  lengthM = FORCE_LENGTH_M,
  currentErrorA = CURRENT_ERROR_A,
  forceErrorMn = FORCE_ERROR_MN,
  separationErrorM = SEPARATION_ERROR_M,
  lengthErrorM = LENGTH_ERROR_M,
): ErrorTerms {
  const forceN = forceMn * 1e-3;
  const mu0 =
    (2 * Math.PI * forceN * separationM) / (currentA * currentA * lengthM);

  const fromCurrent = mu0 * ((2 * currentErrorA) / currentA);
  const fromLength = mu0 * (lengthErrorM / lengthM);
  const fromForce = mu0 * (forceErrorMn / forceMn);
  const fromSeparation = mu0 * (separationErrorM / separationM);

  const totalAbs = fromCurrent + fromLength + fromForce + fromSeparation;
  const pairs: [ErrorTerms["dominant"], number][] = [
    ["current", fromCurrent],
    ["length", fromLength],
    ["force", fromForce],
    ["separation", fromSeparation],
  ];
  let dominant: ErrorTerms["dominant"] = "current";
  let best = fromCurrent;
  for (const [name, value] of pairs) {
    if (value > best) {
      best = value;
      dominant = name;
    }
  }

  return {
    fromCurrent,
    fromLength,
    fromForce,
    fromSeparation,
    totalAbs,
    mu0,
    relativePct: mu0 === 0 ? 0 : (totalAbs / mu0) * 100,
    dominant,
  };
}

/**
 * Relative error of μ₀ obtained from a *fitted slope* rather than a single
 * point. The fit averages the force reading down, so ΔF/F is evaluated at the
 * strongest point of the curve (largest I) instead of at each point; ΔI, Δl
 * and Δr are unchanged, since they are systematic — the same misplacement of
 * the loops sits under every point of the curve and no amount of fitting
 * removes it.
 */
export function slopeRelativeErrorPct(
  maxCurrentA: number,
  maxForceMn: number,
  separationM = SEPARATION_M,
  lengthM = FORCE_LENGTH_M,
): number {
  return errorTerms(maxCurrentA, maxForceMn, separationM, lengthM).relativePct;
}

/** Signed percent difference of `value` against the accepted μ₀. */
export function deltaFromAcceptedPct(mu0: number): number {
  return ((mu0 - MU0_ACCEPTED) / MU0_ACCEPTED) * 100;
}

/**
 * The current at which Δr/r overtakes ΔF/F as the largest term of the budget,
 * in A — the crossover the error chart shows.
 *
 * Both are relative errors along the curve F = a·I², so the condition
 * ΔF/F = Δr/r is (ΔF/(a·I²)) = Δr/r and solves in closed form. Returns null
 * when the crossover falls outside the sweep the experiment can reach.
 */
export function dominantCrossoverA(
  slopeMnPerA2: number,
  maxCurrentA: number,
  forceErrorMn = FORCE_ERROR_MN,
  separationM = SEPARATION_M,
  separationErrorM = SEPARATION_ERROR_M,
): number | null {
  if (slopeMnPerA2 <= 0) return null;
  const i = Math.sqrt(
    (forceErrorMn * separationM) / (slopeMnPerA2 * separationErrorM),
  );
  return i > 0 && i < maxCurrentA ? i : null;
}
