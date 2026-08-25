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
  // Clamp to the interior [1, N-1): conductors must stay off rows/cols 0 and
  // N-1, which applyBoundary rewrites every sweep (see AGENTS.md). Presets pass
  // full-width bounds like [0, sc(80)=N) intending "span the domain"; Neumann
  // walls mirror the field outward so stopping one cell short is equivalent.
  const iMin = Math.max(1, Math.min(i0, i1));
  const iMax = Math.min(N - 1, Math.max(i0, i1));
  const jMin = Math.max(1, Math.min(j0, j1));
  const jMax = Math.min(N - 1, Math.max(j0, j1));
  for (let i = iMin; i < iMax; i++) {
    for (let j = jMin; j < jMax; j++) {
      const k = idx(i, j, N);
      fixed[k] = 1;
      Vfix[k] = v;
    }
  }
}

function setDisc(
  g: GridState,
  ci: number,
  cj: number,
  r: number,
  v: number,
  phaseRad: number = 0,
): void {
  const { N, fixed, Vfix, phase } = g;
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
        phase[k] = phaseRad;
      }
    }
  }
}

function setRing(
  g: GridState,
  ci: number,
  cj: number,
  r: number,
  thickness: number,
  v: number,
): void {
  const { N, fixed, Vfix } = g;
  const r2outer = r * r;
  const r2inner = (r - thickness) * (r - thickness);
  const iMin = Math.max(0, Math.floor(ci - r));
  const iMax = Math.min(N - 1, Math.ceil(ci + r));
  const jMin = Math.max(0, Math.floor(cj - r));
  const jMax = Math.min(N - 1, Math.ceil(cj + r));
  for (let i = iMin; i <= iMax; i++) {
    for (let j = jMin; j <= jMax; j++) {
      const d2 = (i - ci) ** 2 + (j - cj) ** 2;
      if (d2 >= r2inner && d2 <= r2outer) {
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
  | "concentric"
  | "faraday"
  | "tip"
  | "singleconductor"
  | "subconductors"
  | "threephase"
  | "conductors";

interface Preset {
  label: string;
  apply: (g: GridState) => void;
}

export const PRESETS: Record<PresetId, Preset> = {
  parallel: {
    label: "Capacitor plano",
    apply: (g) => {
      clearAll(g);
      const sc = (x: number) => Math.round((x * g.N) / 80);
      setRect(g, sc(20), sc(22), sc(60), sc(25), +100_000);
      setRect(g, sc(20), sc(55), sc(60), sc(58), -100_000);
      applyFixedValues(g);
    },
  },
  dipole: {
    label: "Dipolo",
    apply: (g) => {
      clearAll(g);
      const sc = (x: number) => Math.round((x * g.N) / 80);
      setDisc(g, sc(28), sc(40), sc(3), +100_000);
      setDisc(g, sc(52), sc(40), sc(3), -100_000);
      applyFixedValues(g);
    },
  },
  lightning: {
    label: "Pararrayos simplificado",
    apply: (g) => {
      clearAll(g);
      const sc = (x: number) => Math.round((x * g.N) / 80);
      setRect(g, 0, sc(2), sc(80), sc(5), +100_000); // V1: top plate
      setRect(g, 0, sc(75), sc(80), sc(78), 0); // V2: bottom plate
      setRect(g, sc(39), sc(40), sc(41), sc(76), 0); // V2: vertical rod
      applyFixedValues(g);
    },
  },
  coaxial: {
    label: "Cable Coaxial",
    apply: (g) => {
      clearAll(g);
      const sc = (x: number) => Math.round((x * g.N) / 80);
      setRing(g, sc(40), sc(40), sc(30), sc(2), 0);
      setDisc(g, sc(40), sc(40), sc(8), +80);
      applyFixedValues(g);
    },
  },
  concentric: {
    label: "Cable concéntrico",
    apply: (g) => {
      clearAll(g);
      const sc = (x: number) => Math.round((x * g.N) / 80);
      const cx = sc(40);
      const cy = sc(40);
      // Neutro concéntrico: hilos discretos a 0 V repartidos en un círculo.
      const rNeutral = sc(22);
      const rWire = Math.max(1, sc(1.5));
      const N_WIRES = 12;
      for (let m = 0; m < N_WIRES; m++) {
        const th = (2 * Math.PI * m) / N_WIRES;
        setDisc(
          g,
          Math.round(cx + rNeutral * Math.cos(th)),
          Math.round(cy + rNeutral * Math.sin(th)),
          rWire,
          0,
        );
      }
      // Fase interior (+220 V).
      setDisc(g, cx, cy, sc(9), +220);
      applyFixedValues(g);
    },
  },
  faraday: {
    label: "Jaula de Faraday",
    apply: (g) => {
      clearAll(g);
      const sc = (x: number) => Math.round((x * g.N) / 80);
      // V1: top plate
      setRect(g, 0, sc(2), sc(80), sc(5), +80);
      // V2: bottom plate + closed box enclosure (all ground)
      setRect(g, 0, sc(75), sc(80), sc(78), 0);
      setRect(g, sc(25), sc(44), sc(55), sc(46), 0); // roof
      setRect(g, sc(25), sc(44), sc(27), sc(76), 0); // left wall
      setRect(g, sc(53), sc(44), sc(55), sc(76), 0); // right wall
      applyFixedValues(g);
    },
  },
  conductors: {
    label: "Placas conductoras",
    apply: (g) => {
      clearAll(g);
      const sc = (x: number) => Math.round((x * g.N) / 80);
      setRect(g, sc(10), sc(16), sc(57), sc(18), +100_000); // horizontal plate V1
      setRect(g, sc(60), sc(20), sc(62), sc(68), -100_000); // vertical plate V2
      applyFixedValues(g);
    },
  },
  singleconductor: {
    label: "Línea 1 conductor",
    apply: (g) => {
      clearAll(g);
      const sc = (x: number) => Math.round((x * g.N) / 80);
      const V1 = Math.sqrt(2 / 3) * 500_000;
      setRect(g, 0, sc(75), sc(80), sc(78), 0);
      setDisc(g, sc(40), sc(30), sc(2), V1);
      applyFixedValues(g);
    },
  },
  subconductors: {
    label: "Línea 4 subconductores",
    apply: (g) => {
      clearAll(g);
      const sc = (x: number) => Math.round((x * g.N) / 80);
      const V1 = Math.sqrt(2 / 3) * 500_000;
      setRect(g, 0, sc(75), sc(80), sc(78), 0);
      setDisc(g, sc(36), sc(26), sc(2), V1);
      setDisc(g, sc(44), sc(26), sc(2), V1);
      setDisc(g, sc(36), sc(34), sc(2), V1);
      setDisc(g, sc(44), sc(34), sc(2), V1);
      applyFixedValues(g);
    },
  },
  threephase: {
    label: "Línea trifásica + neutro",
    apply: (g) => {
      clearAll(g);
      const sc = (x: number) => Math.round((x * g.N) / 80);
      const V1 = Math.sqrt(2 / 3) * 500_000;
      const PHI = (2 * Math.PI) / 3;
      setRect(g, 0, sc(75), sc(80), sc(78), 0);
      setDisc(g, sc(36), sc(26), sc(2), V1, 0);
      setDisc(g, sc(44), sc(26), sc(2), V1, PHI);
      setDisc(g, sc(36), sc(34), sc(2), V1, 2 * PHI);
      setDisc(g, sc(44), sc(34), sc(2), 0);
      applyFixedValues(g);
    },
  },
  tip: {
    label: "Punta vs plano",
    apply: (g) => {
      clearAll(g);
      const sc = (x: number) => Math.round((x * g.N) / 80);
      setRect(g, 0, sc(68), sc(80), sc(71), -50);
      setTriangleTipUp(g, sc(40), sc(42), sc(10), sc(6), +80);
      applyFixedValues(g);
    },
  },
};

export const PRESET_ORDER: PresetId[] = [
  "parallel",
  "dipole",
  "lightning",
  "coaxial",
  "concentric",
  "faraday",
  "tip",
  "singleconductor",
  "subconductors",
  "threephase",
  "conductors",
];
