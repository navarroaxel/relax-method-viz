import { applyFixedValues, clearAll, idx } from "@/lib/grid";
import type { GridState } from "@/types";

// All preset coordinates follow TASK.md §10: `i` is the column (x → right),
// `j` is the row (y → down). Rectangle bounds are half-open, [i0, i1) × [j0, j1).

function setRect(
  g: GridState,
  i0: number,
  j0: number,
  i1: number,
  j1: number,
  v: number,
): void {
  const { N, fixed, Vfix } = g;
  const iMin = Math.max(0, Math.min(i0, i1));
  const iMax = Math.min(N, Math.max(i0, i1));
  const jMin = Math.max(0, Math.min(j0, j1));
  const jMax = Math.min(N, Math.max(j0, j1));
  for (let i = iMin; i < iMax; i++) {
    for (let j = jMin; j < jMax; j++) {
      const k = idx(i, j, N);
      fixed[k] = 1;
      Vfix[k] = v;
    }
  }
}

function setHollowRect(
  g: GridState,
  i0: number,
  j0: number,
  i1: number,
  j1: number,
  v: number,
): void {
  const { N, fixed, Vfix } = g;
  const iMin = Math.max(0, Math.min(i0, i1));
  const iMax = Math.min(N, Math.max(i0, i1));
  const jMin = Math.max(0, Math.min(j0, j1));
  const jMax = Math.min(N, Math.max(j0, j1));
  if (iMax <= iMin || jMax <= jMin) return;
  for (let i = iMin; i < iMax; i++) {
    const kTop = idx(i, jMin, N);
    const kBot = idx(i, jMax - 1, N);
    fixed[kTop] = 1;
    Vfix[kTop] = v;
    fixed[kBot] = 1;
    Vfix[kBot] = v;
  }
  for (let j = jMin; j < jMax; j++) {
    const kLeft = idx(iMin, j, N);
    const kRight = idx(iMax - 1, j, N);
    fixed[kLeft] = 1;
    Vfix[kLeft] = v;
    fixed[kRight] = 1;
    Vfix[kRight] = v;
  }
}

function setDisc(
  g: GridState,
  ci: number,
  cj: number,
  r: number,
  v: number,
): void {
  const { N, fixed, Vfix } = g;
  const r2 = r * r;
  const iMin = Math.max(0, Math.floor(ci - r));
  const iMax = Math.min(N - 1, Math.ceil(ci + r));
  const jMin = Math.max(0, Math.floor(cj - r));
  const jMax = Math.min(N - 1, Math.ceil(cj + r));
  for (let i = iMin; i <= iMax; i++) {
    for (let j = jMin; j <= jMax; j++) {
      const di = i - ci;
      const dj = j - cj;
      if (di * di + dj * dj <= r2) {
        const k = idx(i, j, N);
        fixed[k] = 1;
        Vfix[k] = v;
      }
    }
  }
}

function setTriangleTipUp(
  g: GridState,
  ci: number,
  jBase: number,
  jTip: number,
  halfWidthBase: number,
  v: number,
): void {
  const { N, fixed, Vfix } = g;
  if (jTip === jBase) return;
  const span = jBase - jTip;
  const jLo = Math.max(0, Math.min(jTip, jBase));
  const jHi = Math.min(N - 1, Math.max(jTip, jBase));
  for (let j = jLo; j <= jHi; j++) {
    const t = (j - jTip) / span;
    const halfW = Math.max(0, Math.round(t * halfWidthBase));
    const iMin = Math.max(0, ci - halfW);
    const iMax = Math.min(N - 1, ci + halfW);
    for (let i = iMin; i <= iMax; i++) {
      const k = idx(i, j, N);
      fixed[k] = 1;
      Vfix[k] = v;
    }
  }
}

export type PresetId =
  | "parallel"
  | "dipole"
  | "lightning"
  | "coaxial"
  | "faraday"
  | "tip";

interface Preset {
  label: string;
  apply: (g: GridState) => void;
}

export const PRESETS: Record<PresetId, Preset> = {
  parallel: {
    label: "Placas paralelas",
    apply: (g) => {
      clearAll(g);
      setRect(g, 20, 22, 60, 25, +60);
      setRect(g, 20, 55, 60, 58, -60);
      applyFixedValues(g);
    },
  },
  dipole: {
    label: "Dipolo",
    apply: (g) => {
      clearAll(g);
      setDisc(g, 28, 40, 3, +80);
      setDisc(g, 52, 40, 3, -80);
      applyFixedValues(g);
    },
  },
  lightning: {
    label: "Pararrayos + nube",
    apply: (g) => {
      clearAll(g);
      setRect(g, 8, 6, 72, 13, +80);
      setRect(g, 0, 71, 80, 74, 0);
      setTriangleTipUp(g, 40, 70, 32, 5, 0);
      applyFixedValues(g);
    },
  },
  coaxial: {
    label: "Coaxial cuadrado",
    apply: (g) => {
      clearAll(g);
      setHollowRect(g, 14, 14, 66, 66, 0);
      setRect(g, 35, 35, 46, 46, +80);
      applyFixedValues(g);
    },
  },
  faraday: {
    label: "Jaula de Faraday",
    apply: (g) => {
      clearAll(g);
      setHollowRect(g, 14, 14, 58, 58, 0);
      setDisc(g, 36, 36, 3, +80);
      setDisc(g, 68, 36, 3, -80);
      applyFixedValues(g);
    },
  },
  tip: {
    label: "Punta vs plano",
    apply: (g) => {
      clearAll(g);
      setRect(g, 0, 68, 80, 71, -50);
      setTriangleTipUp(g, 40, 42, 10, 6, +80);
      applyFixedValues(g);
    },
  },
};

export const PRESET_ORDER: PresetId[] = [
  "parallel",
  "dipole",
  "lightning",
  "coaxial",
  "faraday",
  "tip",
];
