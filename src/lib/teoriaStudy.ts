export type Grade = "know" | "doubt" | "forgot";

/** Leitner boxes: 0 = no la sé … MAX_BOX = dominada. */
export const MAX_BOX = 4;

export function nextBox(box: number, grade: Grade): number {
  if (grade === "forgot") return 0;
  if (grade === "doubt") return box;
  return Math.min(MAX_BOX, box + 1);
}

/** Cartas en las cajas bajas salen más seguido (peso 2^(MAX_BOX - caja)). */
export function pickNextCard(
  ids: readonly string[],
  boxes: Readonly<Record<string, number>>,
  lastId: string | null,
  rand: () => number,
): string | null {
  const pool = ids.length > 1 ? ids.filter((id) => id !== lastId) : [...ids];
  if (pool.length === 0) return null;
  const weights = pool.map((id) => 2 ** (MAX_BOX - (boxes[id] ?? 0)));
  let r = rand() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i] ?? 0;
    if (r < 0) return pool[i] ?? null;
  }
  return pool[pool.length - 1] ?? null;
}

export function countMastered(
  ids: readonly string[],
  boxes: Readonly<Record<string, number>>,
): number {
  return ids.filter((id) => (boxes[id] ?? 0) >= MAX_BOX).length;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher–Yates con semilla: determinista, así el primer render coincide entre
 * servidor y cliente. Nunca devuelve el orden original (si hay 2+ elementos).
 */
export function shuffleSeeded<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  if (out.length > 1 && out.every((x, i) => x === items[i])) {
    out.push(out.shift() as T);
  }
  return out;
}
