import { MAX_BOX } from "@/lib/teoriaStudy";

const KEY = "relax-viz:teoria-boxes";
const EVENT = "relax-viz:teoria-change";

export type Boxes = Record<string, number>;

const EMPTY: Boxes = {};
let cachedRaw: string | null = null;
let cached: Boxes = EMPTY;

function parse(raw: string | null): Boxes {
  if (!raw) return EMPTY;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return EMPTY;
    const out: Boxes = {};
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === "number") out[k] = Math.max(0, Math.min(MAX_BOX, v));
    }
    return out;
  } catch {
    return EMPTY;
  }
}

export function getBoxes(): Boxes {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cached;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = parse(raw);
  }
  return cached;
}

export function getServerBoxes(): Boxes {
  return EMPTY;
}

export function subscribeBoxes(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function saveBoxes(next: Boxes): void {
  try {
    const raw = JSON.stringify(next);
    localStorage.setItem(KEY, raw);
    cachedRaw = raw;
    cached = next;
  } catch {
    // Sin almacenamiento: el progreso vive solo en esta sesión.
    cached = next;
  }
  window.dispatchEvent(new Event(EVENT));
}
