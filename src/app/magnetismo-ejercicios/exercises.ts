import {
  alphaExact,
  alphaGoodConductor,
  attenuationDistance,
  C0,
  circularLoopAxisField,
  coaxInductancePerLength,
  coaxPoynting,
  conductivityFromDepth,
  displacementCurrentAmplitude,
  EPS0,
  finiteWireField,
  helmholtzCurrent,
  loopNetForce,
  loopTorque,
  lossRatio,
  MU0,
  parallelWireForcePerLength,
  planeWaveInVacuum,
  solenoidField,
  solenoidInductancePerLength,
  solidWireField,
  squareLoopCenterField,
  texNum,
  thinTubeField,
  toroidField,
  toroidInductance,
  tubularInternalInductance,
  twoWireInductancePerLength,
  wireLoopMutual,
} from "@/lib/teoriaExercises";

import type { Step } from "../magnetismo-teoria/content";

export type Params = Record<string, number>;

export interface Field {
  label: string;
  unit: string;
  value: number;
  alt?: number;
  relTol?: number;
  absTol?: number;
}

export interface Strategy {
  prompt: string;
  /** La primera opción es la correcta; la UI las mezcla. */
  options: string[];
  explain: string;
}

export interface Exercise {
  id: string;
  group: "parciales" | "guia";
  source: string;
  title: string;
  /** Aviso sobre diferencias con el PDF o datos que no son del enunciado original. */
  note?: string;
  original: Params;
  vary: (rand: () => number) => Params;
  statement: (p: Params) => string;
  strategy: Strategy;
  fields: (p: Params) => Field[];
  steps: (p: Params) => Step[];
}

const T = String.raw;
const n = (x: number) => texNum(x);
/** Número con unidad en TeX, para enunciados: $12\,\mathrm{cm}$ */
const m = (x: number, unit: string) => `$${n(x)}\\,\\mathrm{${unit}}$`;
const pick = <X>(rand: () => number, xs: readonly X[]): X =>
  xs[Math.floor(rand() * xs.length)] as X;

const EXAMPLE =
  "Los datos numéricos son un ejemplo: en la guía el ejercicio es simbólico.";

export const EXERCISES: Exercise[] = [
  // ───────────────────────── Parciales 2P ─────────────────────────
  {
    id: "p-helmholtz",
    group: "parciales",
    source: "2P 2025-10-27 · P3",
    title: "Dos bobinas: corriente para B en P",
    original: { N: 3000, R: 10, B: 1 },
    vary: (r) => ({
      N: pick(r, [500, 1000, 2000, 3000]),
      R: pick(r, [5, 10, 15, 20]),
      B: pick(r, [0.5, 1, 2]),
    }),
    statement: (p) =>
      `Calcular la corriente que debe circular por ambas bobinas (en la misma dirección y sentido) para obtener en el punto medio P un campo de ${m(p.B ?? 0, "T")}. Son dos bobinas circulares de ${p.N} espiras y radio $R=${p.R}\\,\\mathrm{cm}$, separadas una distancia $R$, con P en el eje a mitad de camino. Justifique.`,
    strategy: {
      prompt: "¿Cómo se combinan los campos de las dos bobinas en P?",
      options: [
        "Se suman: P es equidistante y las corrientes tienen el mismo sentido, así que ambos campos apuntan igual",
        "Se restan, porque cada bobina crea un campo en sentido contrario en P",
        "Se cancelan en el punto medio",
        "Solo cuenta la bobina más cercana",
      ],
      explain:
        "Con corrientes del mismo sentido los campos axiales se suman: $B_P=2B_1$. Con sentidos opuestos (anti-Helmholtz) se cancelarían.",
    },
    fields: (p) => [
      {
        label: "Corriente I",
        unit: "A",
        value: helmholtzCurrent(p.B ?? 0, (p.R ?? 0) / 100, p.N ?? 1),
      },
    ],
    steps: (p) => {
      const rM = (p.R ?? 0) / 100;
      const i = helmholtzCurrent(p.B ?? 0, rM, p.N ?? 1);
      return [
        {
          hint: "Campo de una espira sobre su eje (Biot–Savart)",
          tex: T`B_1=\frac{\mu_0IR^2}{2\left(R^2+z^2\right)^{3/2}}`,
          body: "Por simetría las componentes radiales se anulan al integrar en θ: solo queda la axial.",
        },
        {
          hint: "Evaluar en P ($z=R/2$) con $N$ espiras",
          tex: T`R^2+z^2=\tfrac54R^2\;\Rightarrow\;B_1=\left(\tfrac45\right)^{3/2}\frac{\mu_0NI}{2R}`,
        },
        {
          hint: "Dos bobinas con corriente del mismo sentido: se suman",
          tex: T`B_P=2B_1=\left(\tfrac45\right)^{3/2}\frac{\mu_0NI}{R}`,
        },
        {
          hint: "Despejar la corriente",
          tex: T`I=\frac{B_PR}{\mu_0N\left(4/5\right)^{3/2}}=\frac{${n(p.B ?? 0)}\cdot${n(rM)}}{${n(MU0)}\cdot${p.N}\cdot0{,}7155}\approx${n(i)}\,\mathrm{A}`,
        },
      ];
    },
  },
  {
    id: "p-atenuacion",
    group: "parciales",
    source: "2P 2024-12-16 · P1 / 2023-11-13 · P2",
    title: "Distancia de atenuación en un medio con pérdidas",
    original: { sigma: 0.2, f: 200, pct: 99 },
    vary: (rand) => {
      for (;;) {
        const sigma = pick(rand, [0.1, 0.2, 0.5, 1, 2]);
        const f = pick(rand, [100, 200, 400, 800]);
        if (lossRatio(sigma, f * 1e6) >= 10)
          return { sigma, f, pct: pick(rand, [90, 99, 99.9]) };
      }
    },
    statement: (p) =>
      `En un medio de $\\sigma=${n(p.sigma ?? 0)}\\,\\mathrm{S/m}$ y $\\varepsilon_r=1$ una fuente emite ondas electromagnéticas planas a ${p.f} MHz. Determine la distancia para que la onda se atenúe un ${p.pct}%. Justifique.`,
    strategy: {
      prompt: "¿Cuál es el primer paso para elegir la fórmula de α?",
      options: [
        "Calcular σ/ωε para decidir si el medio es buen conductor o buen dieléctrico",
        "Usar α = 0 porque ε_r = 1 (es como el vacío)",
        "Usar v = c y despejar α",
        "Aplicar la ley de Ampère con simetría",
      ],
      explain:
        "El cociente entre la corriente de conducción y la de desplazamiento decide la aproximación; si $\\gg1$, $\\alpha\\approx\\beta\\approx\\sqrt{\\omega\\mu\\sigma/2}$.",
    },
    fields: (p) => {
      const f = (p.f ?? 1) * 1e6;
      const a = alphaGoodConductor(p.sigma ?? 0, f);
      return [
        {
          label: "σ/(ωε)",
          unit: "",
          value: lossRatio(p.sigma ?? 0, f),
          relTol: 0.02,
        },
        {
          label: "Distancia x",
          unit: "m",
          value: attenuationDistance(a, p.pct ?? 99),
          alt: attenuationDistance(alphaExact(p.sigma ?? 0, f), p.pct ?? 99),
          relTol: 0.05,
        },
      ];
    },
    steps: (p) => {
      const f = (p.f ?? 1) * 1e6;
      const s = p.sigma ?? 0;
      const a = alphaGoodConductor(s, f);
      return [
        {
          hint: "¿Buen conductor o buen dieléctrico?",
          tex: T`\frac{\sigma}{\omega\varepsilon}=\frac{${n(s)}}{2\pi\cdot${n(f)}\cdot8{,}85\times10^{-12}}\approx${n(lossRatio(s, f))}\gg1`,
          body: "Se comporta como buen conductor, con pérdidas importantes.",
        },
        {
          hint: "Constante de atenuación",
          tex: T`\alpha=\sqrt{\frac{\omega\mu\sigma}{2}}=\sqrt{\pi f\mu_0\sigma}\approx${n(a)}\,\mathrm{Np/m}`,
          body: `Profundidad de penetración $\\delta=1/\\alpha\\approx${n((1 / a) * 100)}\\,\\mathrm{cm}$. El α exacto da ${n(alphaExact(s, f))} Np/m: la aproximación es buena porque $\\sigma/\\omega\\varepsilon\\gg1$.`,
        },
        {
          hint: "Amplitud que queda tras atenuarse",
          tex: T`\frac{E(x)}{E_M}=e^{-\alpha x}=${n(1 - (p.pct ?? 0) / 100)}`,
        },
        {
          hint: "Despejar x",
          tex: T`x=\frac{\ln\left(100/${n(100 - (p.pct ?? 0))}\right)}{\alpha}\approx${n(attenuationDistance(a, p.pct ?? 99))}\,\mathrm{m}`,
        },
      ];
    },
  },
  {
    id: "p-espira-fuerza",
    group: "parciales",
    source: "2P 2024-12-16 · P2",
    title: "Fuerza sobre la espira (medición de μ₀)",
    note: EXAMPLE,
    original: { I: 10, L: 30, a: 2, h: 10, d: 2 },
    vary: (r) => ({
      I: pick(r, [5, 10, 20]),
      L: pick(r, [20, 30, 40]),
      a: pick(r, [1, 2, 3]),
      h: pick(r, [5, 10, 15]),
      d: pick(r, [1, 2, 3]),
    }),
    statement: (p) =>
      `Una espira rectangular de largo $L=${p.L}\\,\\mathrm{cm}$ y alto $h=${p.h}\\,\\mathrm{cm}$ está a $d=${p.d}\\,\\mathrm{cm}$ de un conductor recto largo. La corriente $I=${p.I}\\,\\mathrm{A}$ circula por ambos (en la espira, hacia la izquierda por el lado superior; en el conductor, hacia la derecha). El lado superior tiene una abertura de $a=${p.a}\\,\\mathrm{cm}$ por donde entra la corriente. Calcule la fuerza neta sobre la espira.`,
    strategy: {
      prompt:
        "¿Qué pasa con las fuerzas sobre los lados verticales de la espira?",
      options: [
        "Son iguales y opuestas: se anulan",
        "Suman y empujan la espira hacia arriba",
        "Son nulas porque el campo es nulo ahí",
        "Producen el torque que mide el sensor",
      ],
      explain:
        "En un mismo valor de $y$ el campo es el mismo en ambos lados verticales, pero con corrientes opuestas: las fuerzas se cancelan. Solo importan los lados horizontales.",
    },
    fields: (p) => [
      {
        label: "Fuerza neta (hacia el conductor)",
        unit: "mN",
        value:
          loopNetForce({
            currentA: p.I ?? 0,
            lengthM: (p.L ?? 0) / 100,
            gapM: (p.a ?? 0) / 100,
            heightM: (p.h ?? 0) / 100,
            distanceM: (p.d ?? 0) / 100,
          }) * 1e3,
      },
    ],
    steps: (p) => {
      const g = {
        currentA: p.I ?? 0,
        lengthM: (p.L ?? 0) / 100,
        gapM: (p.a ?? 0) / 100,
        heightM: (p.h ?? 0) / 100,
        distanceM: (p.d ?? 0) / 100,
      };
      return [
        {
          hint: "Campo del conductor a altura $y$",
          tex: T`\vec B(y)=\frac{\mu_0I}{2\pi y}\hat a_z,\qquad \vec F=I\int d\vec l\times\vec B`,
        },
        {
          hint: "Lado inferior ($y=d$, longitud $L$, corriente paralela)",
          tex: T`\vec F_1=\frac{\mu_0I^2L}{2\pi d}(-\hat a_y)`,
          body: "Atracción hacia el conductor.",
        },
        {
          hint: "Lado superior ($y=d+h$, longitud $L-a$, corriente antiparalela)",
          tex: T`\vec F_2=\frac{\mu_0I^2(L-a)}{2\pi(d+h)}\hat a_y`,
          body: "Se aleja del conductor.",
        },
        {
          hint: "Fuerza neta y valor de μ₀",
          tex: T`F=\frac{\mu_0I^2}{2\pi}\left[\frac Ld-\frac{L-a}{d+h}\right]\;\Rightarrow\;\mu_0=\frac{2\pi F}{I^2\left[\frac Ld-\frac{L-a}{d+h}\right]}`,
          body: "Si la abertura es despreciable ($a\\ll L$): $\\mu_0=\\dfrac{2\\pi Fd(d+h)}{I^2Lh}$.",
        },
        {
          hint: "Reemplazar",
          tex: T`F\approx${n(loopNetForce(g) * 1e3)}\,\mathrm{mN}\;\text{(hacia el conductor)}`,
        },
      ];
    },
  },
  {
    id: "p-fem-hilo",
    group: "parciales",
    source: "2P 2023-12-11 · P1 · Guía 34",
    title: "Fem inducida en una espira junto a un hilo",
    original: { I0: 100, w: 314, h: 3, wd: 0.3, d: 0.1 },
    vary: (r) => ({
      I0: pick(r, [50, 100, 200]),
      w: pick(r, [314, 377, 628]),
      h: pick(r, [1, 2, 3]),
      wd: pick(r, [0.1, 0.2, 0.3]),
      d: pick(r, [0.05, 0.1, 0.2]),
    }),
    statement: (p) =>
      `Un conductor recto lleva $i(t)=${p.I0}\\sin(${p.w}t)\\,\\mathrm{A}$. Una espira rectangular coplanar de largo $h=${p.h}\\,\\mathrm{m}$ (paralelo al conductor) y ancho $w=${p.wd}\\,\\mathrm{m}$ tiene su lado más cercano a $d=${p.d}\\,\\mathrm{m}$. Halle la inductancia mutua y la amplitud de la fem inducida.`,
    strategy: {
      prompt: "¿Qué tipo de fem aparece en la espira?",
      options: [
        "Fem de transformador: la espira está quieta y el flujo varía por $i(t)$",
        "Fem cinética: la espira se mueve en el campo del hilo",
        "Ninguna: el campo del hilo es estático",
        "Fem cinética y de transformador por igual",
      ],
      explain:
        "No hay movimiento ($\\vec v=0$), así que no hay fem cinética; toda la fem viene de $-d\\Phi/dt$ con $\\Phi$ proporcional a $i(t)$.",
    },
    fields: (p) => {
      const mu = wireLoopMutual(p.h ?? 0, p.wd ?? 0, p.d ?? 1);
      return [
        { label: "Inductancia mutua M", unit: "µH", value: mu * 1e6 },
        {
          label: "Fem máxima",
          unit: "mV",
          value: mu * (p.w ?? 0) * (p.I0 ?? 0) * 1e3,
        },
      ];
    },
    steps: (p) => {
      const mu = wireLoopMutual(p.h ?? 0, p.wd ?? 0, p.d ?? 1);
      const emax = mu * (p.w ?? 0) * (p.I0 ?? 0);
      return [
        {
          hint: "Campo del hilo (Ampère)",
          tex: T`\oint\vec H\cdot d\vec l=i\;\Rightarrow\;\vec B(r,t)=\frac{\mu_0i(t)}{2\pi r}`,
        },
        {
          hint: "Flujo concatenado por la espira",
          tex: T`\Phi=\int_d^{d+w}\frac{\mu_0i}{2\pi r}h\,dr=\frac{\mu_0h}{2\pi}\ln\frac{d+w}{d}\,i(t)=M\,i(t)`,
        },
        {
          hint: "Valor de M",
          tex: T`M=\frac{\mu_0h}{2\pi}\ln\frac{d+w}{d}=${n(mu * 1e6)}\,\mu\mathrm{H}`,
        },
        {
          hint: "Faraday: $\\varepsilon=-d\\Phi/dt$",
          tex: T`\varepsilon(t)=-M\frac{di}{dt}=-${n(emax * 1e3)}\cos(${p.w}t)\,\mathrm{mV}`,
          body: "La corriente inducida es antihoraria cuando $di/dt>0$ (Lenz).",
        },
      ];
    },
  },
  {
    id: "p-onda-plana",
    group: "parciales",
    source: "2P 2023-12-11 · P2",
    title: "Campos D, B, H de una onda plana en el vacío",
    note: "La guía escribe H sobre â_z, pero con E sobre â_y y propagación en +z, H queda sobre −â_x (E×H debe apuntar en +z). Acá se usa la versión corregida. Los datos numéricos son un ejemplo.",
    original: { EM: 377, f: 100 },
    vary: (r) => ({
      EM: pick(r, [10, 50, 100, 377]),
      f: pick(r, [50, 100, 300, 1000]),
    }),
    statement: (p) =>
      `Dado $\\vec E(z,t)=E_M\\sin(\\omega t-\\beta z)\\hat a_y$ en el espacio libre, con $E_M=${p.EM}\\,\\mathrm{V/m}$ y $f=${p.f}\\,\\mathrm{MHz}$, halle $\\beta$ y las amplitudes de $\\vec H$ y $\\vec B$.`,
    strategy: {
      prompt: "¿Hacia dónde apunta $\\vec H$?",
      options: [
        "Sobre $-\\hat a_x$: perpendicular a $\\vec E$ y a la propagación, con $\\vec E\\times\\vec H$ en $+z$",
        "Sobre $+\\hat a_z$, en la dirección de propagación",
        "Sobre $+\\hat a_y$, paralelo a $\\vec E$",
        "Sobre $+\\hat a_x$",
      ],
      explain:
        "Onda plana transversal: $\\vec E$, $\\vec H$ y la dirección de propagación son ortogonales y $\\vec E\\times\\vec H$ da la propagación. Con $\\hat a_y\\times(-\\hat a_x)=+\\hat a_z$.",
    },
    fields: (p) => {
      const w = planeWaveInVacuum(p.EM ?? 0, (p.f ?? 1) * 1e6);
      return [
        { label: "β", unit: "rad/m", value: w.beta },
        { label: "H_M", unit: "A/m", value: w.hMax },
        { label: "B_M", unit: "µT", value: w.bMax * 1e6 },
      ];
    },
    steps: (p) => {
      const w = planeWaveInVacuum(p.EM ?? 0, (p.f ?? 1) * 1e6);
      return [
        {
          hint: "Constante de fase e impedancia del vacío",
          tex: T`\beta=\omega\sqrt{\mu_0\varepsilon_0}=\frac{\omega}{c_0}=${n(w.beta)}\,\mathrm{rad/m},\qquad \eta_0=\sqrt{\frac{\mu_0}{\varepsilon_0}}=120\pi\,\Omega`,
        },
        {
          hint: "Campo D",
          tex: T`\vec D=\varepsilon_0\vec E=\varepsilon_0E_M\sin(\omega t-\beta z)\hat a_y`,
        },
        {
          hint: "Campo H por Faraday",
          tex: T`\nabla\times\vec E=-\mu_0\frac{\partial\vec H}{\partial t}\;\Rightarrow\;\vec H=-\frac{E_M}{\eta_0}\sin(\omega t-\beta z)\hat a_x`,
          body: `Se descarta un $\\vec H_0(z)$ estático: no hay fuentes que lo generen. $H_M=E_M/\\eta_0=${n(w.hMax)}\\,\\mathrm{A/m}$.`,
        },
        {
          hint: "Campo B",
          tex: T`\vec B=\mu_0\vec H,\qquad B_M=\frac{E_M}{c_0}=${n(w.bMax * 1e6)}\,\mu\mathrm{T}`,
        },
      ];
    },
  },
  {
    id: "p-hilo-finito",
    group: "parciales",
    source: "2P 2023-11-13 · P1 · Guía 29",
    title: "Campo de un conductor finito",
    note: EXAMPLE,
    original: { I: 100, L: 2, r: 10 },
    vary: (r) => ({
      I: pick(r, [10, 50, 100]),
      L: pick(r, [0.5, 1, 2, 5]),
      r: pick(r, [2, 5, 10, 25]),
    }),
    statement: (p) =>
      `Determine $B$ en un punto a distancia $r=${p.r}\\,\\mathrm{cm}$ del centro de un conductor recto de longitud finita $L=${p.L}\\,\\mathrm{m}$ con $I=${p.I}\\,\\mathrm{A}$, y compárelo con el de un conductor infinito.`,
    strategy: {
      prompt:
        "¿Por qué no se puede aplicar la ley de Ampère a un conductor finito?",
      options: [
        "No hay camino cerrado con $H$ constante por simetría, y un tramo con corriente no es un circuito cerrado",
        "Porque la ley de Ampère solo vale para corrientes alternas",
        "Porque $\\nabla\\cdot\\vec B\\neq0$ en un conductor finito",
        "Sí se puede, da el mismo resultado",
      ],
      explain:
        "Ampère exige la simetría del conductor infinito. Para un tramo finito hay que usar Biot–Savart.",
    },
    fields: (p) => {
      const f = finiteWireField(p.I ?? 0, p.L ?? 0, (p.r ?? 0) / 100);
      return [
        { label: "B (finito)", unit: "µT", value: f.b * 1e6 },
        { label: "(B∞ − B)/B", unit: "%", value: f.errPct, absTol: 0.005 },
      ];
    },
    steps: (p) => {
      const f = finiteWireField(p.I ?? 0, p.L ?? 0, (p.r ?? 0) / 100);
      return [
        {
          hint: "Biot–Savart con $d\\vec l=dz\\,\\hat a_z$",
          tex: T`\vec B=\frac{\mu_0I}{4\pi}\int_{-L/2}^{L/2}\frac{d\vec l\times\vec R}{R^3},\quad \vec R=(0,r,-z),\; |\vec R|=\sqrt{r^2+z^2}`,
        },
        {
          hint: "Integrar",
          tex: T`\vec B=\frac{\mu_0I}{2\pi r}\frac{L}{\sqrt{L^2+4r^2}}(-\hat a_x)`,
        },
        {
          hint: "Límite $r\\ll L$",
          tex: T`\frac{L}{\sqrt{L^2+4r^2}}=\frac{1}{\sqrt{1+4r^2/L^2}}\to1\;\Rightarrow\;B=\frac{\mu_0I}{2\pi r}`,
          body: "Recupera el campo del conductor infinito (el mismo de Ampère).",
        },
        {
          hint: "Números",
          tex: T`B=${n(f.b * 1e6)}\,\mu\mathrm{T}\;\text{vs}\;B_\infty=${n(f.bInf * 1e6)}\,\mu\mathrm{T}\;\Rightarrow\;\text{dif.}=${n(f.errPct)}\%`,
        },
      ];
    },
  },
  {
    id: "p-tres-conductores",
    group: "parciales",
    source: "2P 2021-11-15 · P1",
    title: "Tres conductores en un triángulo equilátero",
    note: "Se asume la misma corriente en los tres conductores, como en la resolución.",
    original: { I: 25, d: 10 },
    vary: (r) => ({ I: pick(r, [10, 25, 50, 100]), d: pick(r, [5, 10, 20]) }),
    statement: (p) =>
      `Tres conductores paralelos ocupan los vértices de un triángulo equilátero de lado $${p.d}\\,\\mathrm{cm}$, todos con corriente $${p.I}\\,\\mathrm{A}$ saliendo de la hoja. Calcule la fuerza por unidad de longitud sobre cada conductor y la fuerza resultante sobre el sistema.`,
    strategy: {
      prompt: "Con corrientes paralelas, la fuerza entre dos conductores es:",
      options: [
        "De atracción",
        "De repulsión",
        "Nula",
        "Perpendicular al plano del triángulo",
      ],
      explain:
        "Corrientes paralelas se atraen y antiparalelas se repelen. Cada conductor es atraído hacia los otros dos.",
    },
    fields: (p) => {
      const f = parallelWireForcePerLength(p.I ?? 0, (p.d ?? 1) / 100);
      return [
        { label: "F/L entre un par", unit: "mN/m", value: f * 1e3 },
        {
          label: "F/L resultante sobre un conductor",
          unit: "mN/m",
          value: Math.sqrt(3) * f * 1e3,
        },
        {
          label: "Fuerza resultante sobre el sistema",
          unit: "mN/m",
          value: 0,
          absTol: 1e-6,
        },
      ];
    },
    steps: (p) => {
      const f = parallelWireForcePerLength(p.I ?? 0, (p.d ?? 1) / 100);
      return [
        {
          hint: "Fuerza por unidad de longitud entre dos conductores",
          tex: T`\frac FL=\frac{\mu_0I^2}{2\pi d}=${n(f * 1e3)}\,\mathrm{mN/m}`,
        },
        {
          hint: "Sobre un conductor actúan dos fuerzas a 60°",
          tex: T`\frac{F_1}{L}=2\frac FL\cos30^\circ=\sqrt3\,\frac FL=${n(Math.sqrt(3) * f * 1e3)}\,\mathrm{mN/m}`,
          body: "Apunta hacia el centro del triángulo.",
        },
        {
          hint: "Resultante sobre el sistema",
          body: "Cero: las tres fuerzas sobre los conductores, dirigidas al centro con igual módulo a 120°, suman cero (también por acción y reacción).",
        },
      ];
    },
  },
  {
    id: "p-inductancia-tubo",
    group: "parciales",
    source: "2P 2021-11-15 · P2",
    title: "Inductancia interna de un conductor tubular",
    note:
      "La expresión final de la guía tiene errores de tipeo (b³ en vez de b², y falta el cuadrado en (b²−a²)). Acá está la versión corregida, verificada por integración numérica. " +
      EXAMPLE,
    original: { a: 20, b: 30 },
    vary: (r) => {
      const a = pick(r, [10, 20, 30]);
      return { a, b: a + pick(r, [10, 20, 30]) };
    },
    statement: (p) =>
      `Calcule la inductancia interna por unidad de longitud de una barra para una estación transformadora de alta tensión: un conductor tubular hueco de aluminio con radios interno $a=${p.a}\\,\\mathrm{mm}$ y externo $b=${p.b}\\,\\mathrm{mm}$ ($\\mu=\\mu_0$).`,
    strategy: {
      prompt: "¿Cuánto vale $H$ en el hueco ($r<a$)?",
      options: [
        "Cero: la corriente encerrada es nula",
        "$I/(2\\pi r)$, igual que afuera",
        "$Ir/(2\\pi a^2)$, como en un conductor macizo",
        "Depende de $\\mu$ del aluminio",
      ],
      explain:
        "La corriente circula solo entre $a$ y $b$; por Ampère el campo en el hueco es nulo.",
    },
    fields: (p) => [
      {
        label: "L' (por unidad de longitud)",
        unit: "nH/m",
        value:
          tubularInternalInductance((p.a ?? 1) / 1000, (p.b ?? 2) / 1000) * 1e9,
      },
    ],
    steps: (p) => {
      const l = tubularInternalInductance((p.a ?? 1) / 1000, (p.b ?? 2) / 1000);
      return [
        {
          hint: "Corriente encerrada para $a<r<b$ y campo (Ampère)",
          tex: T`I_{enc}=I\frac{r^2-a^2}{b^2-a^2}\;\Rightarrow\;H=\frac{I\,(r^2-a^2)}{2\pi r\,(b^2-a^2)}`,
          body: "En el hueco ($r<a$): $H=0$.",
        },
        {
          hint: "Energía magnética por unidad de longitud",
          tex: T`\frac{W_M}{h}=\int_a^b\tfrac12\mu H^2\,2\pi r\,dr=\frac{\mu I^2}{4\pi(b^2-a^2)^2}\int_a^b\frac{(r^2-a^2)^2}{r}dr`,
        },
        {
          hint: "Resolver la integral",
          tex: T`\int_a^b\left(r^3-2a^2r+\frac{a^4}{r}\right)dr=\frac{(b^2-a^2)(b^2-3a^2)}{4}+a^4\ln\frac ba`,
        },
        {
          hint: "$L'=2W_M/(hI^2)$",
          tex: T`L'=\frac{\mu(b^2-3a^2)}{8\pi(b^2-a^2)}+\frac{\mu a^4}{2\pi(b^2-a^2)^2}\ln\frac ba=${n(l * 1e9)}\,\mathrm{nH/m}`,
          body: "Chequeo: para $a\\to0$ da $\\mu/8\\pi$, el valor del conductor macizo.",
        },
      ];
    },
  },

  // ───────────────────── Guía de ejercicios (25 en adelante) ─────────────────────
  {
    id: "g25",
    group: "guia",
    source: "Guía · 25",
    title: "Conductor sólido: B dentro y fuera",
    note: EXAMPLE,
    original: { I: 100, b: 5, rin: 2.5, rout: 15 },
    vary: (r) => ({
      I: pick(r, [50, 100, 200]),
      b: pick(r, [3, 5, 10]),
      rin: pick(r, [1, 2, 2.5]),
      rout: pick(r, [12, 15, 20]),
    }),
    statement: (p) =>
      `Por un conductor sólido recto infinito de radio $b=${p.b}\\,\\mathrm{mm}$ circula una corriente estacionaria $I=${p.I}\\,\\mathrm{A}$. Determine $B$ a $r=${p.rin}\\,\\mathrm{mm}$ (dentro) y a $r=${p.rout}\\,\\mathrm{mm}$ (fuera).`,
    strategy: {
      prompt: "Dentro del conductor ($r<b$), ¿cómo varía $B$ con $r$?",
      options: [
        "Linealmente: $B\\propto r$",
        "Como $1/r$",
        "Es constante",
        "Es nulo",
      ],
      explain:
        "La corriente encerrada crece como $r^2$ y el perímetro como $r$: $H=Ir/(2\\pi b^2)$. Afuera decae como $1/r$.",
    },
    fields: (p) => [
      {
        label: "B dentro",
        unit: "µT",
        value:
          solidWireField(p.I ?? 0, (p.b ?? 1) / 1000, (p.rin ?? 0) / 1000) *
          1e6,
      },
      {
        label: "B fuera",
        unit: "µT",
        value:
          solidWireField(p.I ?? 0, (p.b ?? 1) / 1000, (p.rout ?? 0) / 1000) *
          1e6,
      },
    ],
    steps: (p) => [
      {
        hint: "Densidad de corriente uniforme",
        tex: T`|\vec J|=\frac{I}{\pi b^2}\;(0\le r\le b),\qquad 0\;(r>b)`,
      },
      {
        hint: "Dentro: Ampère con $I_{enc}=Ir^2/b^2$",
        tex: T`H\,2\pi r=\frac{Ir^2}{b^2}\;\Rightarrow\;B=\frac{\mu_0Ir}{2\pi b^2}=${n(solidWireField(p.I ?? 0, (p.b ?? 1) / 1000, (p.rin ?? 0) / 1000) * 1e6)}\,\mu\mathrm{T}`,
      },
      {
        hint: "Fuera: toda la corriente queda encerrada",
        tex: T`H\,2\pi r=I\;\Rightarrow\;B=\frac{\mu_0I}{2\pi r}=${n(solidWireField(p.I ?? 0, (p.b ?? 1) / 1000, (p.rout ?? 0) / 1000) * 1e6)}\,\mu\mathrm{T}`,
      },
    ],
  },
  {
    id: "g26",
    group: "guia",
    source: "Guía · 26",
    title: "Bobina toroidal: inducción interior",
    note:
      "El enunciado de la guía habla de radio medio b, pero la resolución usa a < r < b como radios interior y exterior del toroide. " +
      EXAMPLE,
    original: { N: 500, I: 2, a: 40, b: 60, r: 50 },
    vary: (rd) => {
      const a = pick(rd, [30, 40, 50]);
      const b = a + pick(rd, [20, 30]);
      return {
        N: pick(rd, [200, 500, 1000]),
        I: pick(rd, [1, 2, 5]),
        a,
        b,
        r: (a + b) / 2,
      };
    },
    statement: (p) =>
      `Un toroide con núcleo de aire, espiras muy juntas, $N=${p.N}$ espiras y corriente $I=${p.I}\\,\\mathrm{A}$ tiene radio interior $a=${p.a}\\,\\mathrm{mm}$ y exterior $b=${p.b}\\,\\mathrm{mm}$. Halle $B$ a $r=${p.r}\\,\\mathrm{mm}$ (dentro del toroide) y fuera de él.`,
    strategy: {
      prompt: "¿Qué camino de integración conviene para aplicar Ampère?",
      options: [
        "Una circunferencia de radio $r$ coaxial con el toroide",
        "Un rectángulo que atraviesa el núcleo",
        "Una esfera centrada en el toroide",
        "Ninguno: hay que usar Biot–Savart",
      ],
      explain:
        "Por simetría $H$ es azimutal y constante sobre esa circunferencia; encierra $NI$ si $a<r<b$ y cero (neto) si está afuera.",
    },
    fields: (p) => [
      {
        label: "B dentro",
        unit: "mT",
        value: toroidField(p.N ?? 1, p.I ?? 0, (p.r ?? 1) / 1000) * 1e3,
      },
      { label: "B fuera", unit: "mT", value: 0, absTol: 1e-6 },
    ],
    steps: (p) => [
      {
        hint: "Ampère con el camino circular",
        tex: T`\oint\vec H\cdot d\vec l=NI\;\Rightarrow\;H\,2\pi r=NI`,
      },
      {
        hint: "Dentro ($a<r<b$)",
        tex: T`B=\frac{\mu_0NI}{2\pi r}=${n(toroidField(p.N ?? 1, p.I ?? 0, (p.r ?? 1) / 1000) * 1e3)}\,\mathrm{mT}`,
      },
      {
        hint: "Fuera",
        body: "La corriente neta encerrada es cero (entra y sale en cada espira): $B=0$.",
      },
    ],
  },
  {
    id: "g27",
    group: "guia",
    source: "Guía · 27",
    title: "Tubo delgado con corriente superficial",
    note: EXAMPLE,
    original: { I: 100, b: 5, r: 10 },
    vary: (r) => ({
      I: pick(r, [50, 100, 200]),
      b: pick(r, [3, 5, 10]),
      r: pick(r, [12, 15, 20]),
    }),
    statement: (p) =>
      `Por un tubo conductor muy delgado e infinitamente largo, de radio $b=${p.b}\\,\\mathrm{mm}$, circula una corriente superficial uniforme de total $I=${p.I}\\,\\mathrm{A}$. Encuentre $B$ en el interior y a $r=${p.r}\\,\\mathrm{mm}$.`,
    strategy: {
      prompt: "¿Cuánto vale $B$ dentro del tubo ($r<b$)?",
      options: [
        "Cero: no hay corriente encerrada",
        "$\\mu_0I/(2\\pi b)$",
        "Crece linealmente con $r$",
        "Depende de la longitud del tubo",
      ],
      explain:
        "La corriente está toda en la superficie: dentro $I_{enc}=0$. Afuera $B=\\mu_0I/2\\pi r$ (salto en $r=b$ de $\\mu_0J_s$).",
    },
    fields: (p) => [
      { label: "B dentro", unit: "µT", value: 0, absTol: 1e-6 },
      {
        label: "B fuera",
        unit: "µT",
        value:
          thinTubeField(p.I ?? 0, (p.b ?? 1) / 1000, (p.r ?? 0) / 1000) * 1e6,
      },
    ],
    steps: (p) => [
      {
        hint: "Densidad superficial",
        tex: T`J_s=\frac{I}{2\pi b}`,
      },
      { hint: "Dentro ($r<b$)", tex: T`\vec H=0` },
      {
        hint: "Fuera ($r>b$)",
        tex: T`H\,2\pi r=J_s\,2\pi b\;\Rightarrow\;\vec B=\frac{\mu_0J_sb}{r}\hat a_\varphi=\frac{\mu_0I}{2\pi r}\hat a_\varphi=${n(thinTubeField(p.I ?? 0, (p.b ?? 1) / 1000, (p.r ?? 0) / 1000) * 1e6)}\,\mu\mathrm{T}`,
      },
    ],
  },
  {
    id: "g28",
    group: "guia",
    source: "Guía · 28",
    title: "Solenoide largo",
    note: EXAMPLE,
    original: { n: 1000, I: 2 },
    vary: (r) => ({
      n: pick(r, [500, 1000, 2000, 5000]),
      I: pick(r, [1, 2, 5]),
    }),
    statement: (p) =>
      `Encuentre la densidad de flujo magnético dentro y fuera de un solenoide cilíndrico muy largo con núcleo de aire, $n=${p.n}$ espiras por metro y corriente $I=${p.I}\\,\\mathrm{A}$.`,
    strategy: {
      prompt:
        "¿Qué da el campo exterior en el límite $L\\gg h$ (solenoide muy largo)?",
      options: ["Cero", "$\\mu_0nI/2$", "$\\mu_0nI$", "Decae como $1/r$"],
      explain:
        "Los dos lazos de Ampère del enunciado dan campos que en el exterior se restan y se anulan; en el interior se suman: $B=\\mu_0nI$.",
    },
    fields: (p) => [
      {
        label: "B dentro",
        unit: "mT",
        value: solenoidField(p.n ?? 0, p.I ?? 0) * 1e3,
      },
      { label: "B fuera", unit: "mT", value: 0, absTol: 1e-6 },
    ],
    steps: (p) => [
      {
        hint: "Superposición de dos lazos de Ampère",
        tex: T`B_1=B_2=\frac{\mu_0NI}{2(L+h)}`,
      },
      {
        hint: "Dentro ($L\\gg h$)",
        tex: T`B=B_1+B_2=\frac{\mu_0NI}{L}=\mu_0nI=${n(solenoidField(p.n ?? 0, p.I ?? 0) * 1e3)}\,\mathrm{mT}`,
      },
      { hint: "Fuera", tex: T`B=B_1-B_2=0` },
    ],
  },
  {
    id: "g30",
    group: "guia",
    source: "Guía · 30",
    title: "Centro de una espira cuadrada",
    note: EXAMPLE,
    original: { I: 10, w: 20 },
    vary: (r) => ({ I: pick(r, [5, 10, 20]), w: pick(r, [10, 20, 40]) }),
    statement: (p) =>
      `Encuentre la inducción en el centro de una espira cuadrada plana de lado $w=${p.w}\\,\\mathrm{cm}$ por la que circula $I=${p.I}\\,\\mathrm{A}$.`,
    strategy: {
      prompt: "¿Cómo se obtiene el campo total en el centro?",
      options: [
        "Se calcula el de un lado con Biot–Savart y se multiplica por 4 (mismo sentido)",
        "Con Ampère, por la simetría cuadrada",
        "Se suman 2 lados y se restan 2",
        "Es nulo por simetría",
      ],
      explain:
        "Los cuatro lados aportan igual y en el mismo sentido (saliente/entrante). Ampère no aplica: no hay un camino con $H$ constante.",
    },
    fields: (p) => [
      {
        label: "B en el centro",
        unit: "µT",
        value: squareLoopCenterField(p.I ?? 0, (p.w ?? 1) / 100) * 1e6,
      },
    ],
    steps: (p) => [
      {
        hint: "Un lado (Biot–Savart, distancia al centro $w/2$)",
        tex: T`\vec B_1=\frac{\mu_0I}{4\pi}\frac w2\int_{-w/2}^{w/2}\frac{dx}{\left(x^2+w^2/4\right)^{3/2}}\hat a_z=\frac{\sqrt2}{2}\frac{\mu_0I}{\pi w}\hat a_z`,
      },
      {
        hint: "Cuatro lados iguales",
        tex: T`B=4B_1=\frac{2\sqrt2\,\mu_0I}{\pi w}=${n(squareLoopCenterField(p.I ?? 0, (p.w ?? 1) / 100) * 1e6)}\,\mu\mathrm{T}`,
      },
    ],
  },
  {
    id: "g31",
    group: "guia",
    source: "Guía · 31",
    title: "Eje de una espira circular",
    note: EXAMPLE,
    original: { I: 10, b: 5, z: 5 },
    vary: (r) => ({
      I: pick(r, [5, 10, 20]),
      b: pick(r, [3, 5, 10]),
      z: pick(r, [0, 3, 5, 10]),
    }),
    statement: (p) =>
      `Determine $B$ sobre el eje de una espira circular de radio $b=${p.b}\\,\\mathrm{cm}$ con $I=${p.I}\\,\\mathrm{A}$, en un punto a $z=${p.z}\\,\\mathrm{cm}$ del plano de la espira.`,
    strategy: {
      prompt: "¿Qué componentes del campo sobreviven sobre el eje?",
      options: [
        "Solo la axial: las radiales se cancelan por simetría",
        "Solo la radial",
        "Las dos, con igual peso",
        "Ninguna: $B=0$ sobre el eje",
      ],
      explain:
        "Al integrar $\\cos\\varphi$ y $\\sin\\varphi$ entre $0$ y $2\\pi$ da cero; queda solo la componente $z$.",
    },
    fields: (p) => [
      {
        label: "B",
        unit: "µT",
        value:
          circularLoopAxisField(p.I ?? 0, (p.b ?? 1) / 100, (p.z ?? 0) / 100) *
          1e6,
      },
    ],
    steps: (p) => [
      {
        hint: "Biot–Savart con $d\\vec l=\\rho\\,d\\varphi(-\\sin\\varphi,\\cos\\varphi,0)$",
        tex: T`\vec B=\frac{\mu_0I}{4\pi}\int_0^{2\pi}\frac{(z\cos\varphi,\,z\sin\varphi,\,\rho)\,\rho\,d\varphi}{(\rho^2+z^2)^{3/2}}`,
      },
      {
        hint: "Se anulan las componentes radiales",
        tex: T`\vec B=\frac{\mu_0Ib^2}{2\left(b^2+z^2\right)^{3/2}}\hat a_z=${n(circularLoopAxisField(p.I ?? 0, (p.b ?? 1) / 100, (p.z ?? 0) / 100) * 1e6)}\,\mu\mathrm{T}`,
      },
    ],
  },
  {
    id: "g32",
    group: "guia",
    source: "Guía · 32",
    title: "Autoinductancia del toroide",
    note:
      "La guía resuelve un toroide de sección rectangular (alto h, radios a y b). " +
      EXAMPLE,
    original: { N: 500, h: 2, a: 4, b: 6 },
    vary: (r) => {
      const a = pick(r, [3, 4, 5]);
      return {
        N: pick(r, [200, 500, 1000]),
        h: pick(r, [1, 2, 3]),
        a,
        b: a + pick(r, [1, 2, 3]),
      };
    },
    statement: (p) =>
      `Determine la autoinductancia de un toroide de sección rectangular de alto $h=${p.h}\\,\\mathrm{cm}$, radio interior $a=${p.a}\\,\\mathrm{cm}$, exterior $b=${p.b}\\,\\mathrm{cm}$ y $N=${p.N}$ espiras.`,
    strategy: {
      prompt: "¿Qué flujo se usa en $L=\\lambda/I$?",
      options: [
        "El flujo concatenado $N\\Phi$ (N espiras × flujo por espira)",
        "Solo el flujo por una espira $\\Phi$",
        "El flujo fuera del toroide",
        "El flujo total dividido por $N$",
      ],
      explain:
        "$\\lambda=N\\Phi$ y $\\Phi=\\int B\\,dS$ sobre la sección; por eso $L\\propto N^2$.",
    },
    fields: (p) => [
      {
        label: "Autoinductancia L",
        unit: "mH",
        value:
          toroidInductance(
            p.N ?? 1,
            (p.h ?? 0) / 100,
            (p.a ?? 1) / 100,
            (p.b ?? 2) / 100,
          ) * 1e3,
      },
    ],
    steps: (p) => [
      {
        hint: "Flujo concatenado con $B=\\mu_0NI/2\\pi r$",
        tex: T`L=\frac{N\Phi}{I}=\frac NI\int_a^b\int_0^h\frac{\mu_0NI}{2\pi r}\,dy\,dr`,
      },
      {
        hint: "Resultado",
        tex: T`L=\frac{\mu_0hN^2}{2\pi}\ln\frac ba=${n(toroidInductance(p.N ?? 1, (p.h ?? 0) / 100, (p.a ?? 1) / 100, (p.b ?? 2) / 100) * 1e3)}\,\mathrm{mH}`,
      },
    ],
  },
  {
    id: "g33",
    group: "guia",
    source: "Guía · 33",
    title: "Autoinductancia por metro de un solenoide",
    note:
      "La guía llega a «μN²πr²/l», que tiene unidades de henrio y no de H/m: falta un /l. El resultado correcto por unidad de longitud es μ n² π r². " +
      EXAMPLE,
    original: { n: 1000, r: 10 },
    vary: (rd) => ({
      n: pick(rd, [500, 1000, 2000]),
      r: pick(rd, [5, 10, 20]),
    }),
    statement: (p) =>
      `Determine la autoinductancia por unidad de longitud de un solenoide muy largo con $n=${p.n}$ vueltas por metro, radio $r=${p.r}\\,\\mathrm{mm}$ y núcleo de aire.`,
    strategy: {
      prompt: "Si se duplica $n$, la inductancia por unidad de longitud:",
      options: [
        "Se cuadruplica",
        "Se duplica",
        "No cambia",
        "Se reduce a la mitad",
      ],
      explain:
        "Hay más espiras por metro y cada una concatena un flujo mayor ($B\\propto n$): $L'\\propto n^2$.",
    },
    fields: (p) => [
      {
        label: "L por unidad de longitud",
        unit: "mH/m",
        value: solenoidInductancePerLength(p.n ?? 0, (p.r ?? 0) / 1000) * 1e3,
      },
    ],
    steps: (p) => [
      {
        hint: "Campo y flujo por espira",
        tex: T`B=\mu nI,\qquad \Phi=B\,\pi r^2=\mu nI\pi r^2`,
      },
      {
        hint: "Flujo concatenado por unidad de longitud ($n$ espiras por metro)",
        tex: T`\frac Ll=\frac{n\Phi}{I}=\mu n^2\pi r^2=${n(solenoidInductancePerLength(p.n ?? 0, (p.r ?? 0) / 1000) * 1e3)}\,\mathrm{mH/m}`,
      },
    ],
  },
  {
    id: "g36",
    group: "guia",
    source: "Guía · 36",
    title: "Línea coaxial: inductancia por energía",
    note: EXAMPLE,
    original: { a: 2, b: 6 },
    vary: (r) => {
      const a = pick(r, [1, 2, 3]);
      return { a, b: a * pick(r, [2, 3, 4]) };
    },
    statement: (p) =>
      `Una línea coaxial llena de aire tiene un conductor interno sólido de radio $a=${p.a}\\,\\mathrm{mm}$ y uno externo muy delgado de radio $b=${p.b}\\,\\mathrm{mm}$. Con la energía magnética almacenada, halle la inductancia por unidad de longitud.`,
    strategy: {
      prompt: "¿Cuánto vale $H$ para $r>b$?",
      options: [
        "Cero: la corriente neta encerrada es nula (ida + vuelta)",
        "$I/(2\\pi r)$",
        "$I/(2\\pi b)$",
        "Depende de $\\mu$",
      ],
      explain:
        "El conductor externo transporta la corriente de retorno: afuera de él, $I_{enc}=0$.",
    },
    fields: (p) => [
      {
        label: "L' (por unidad de longitud)",
        unit: "nH/m",
        value:
          coaxInductancePerLength((p.a ?? 1) / 1000, (p.b ?? 2) / 1000) * 1e9,
      },
    ],
    steps: (p) => [
      {
        hint: "Campo $H$ por zonas",
        tex: T`H=\frac{Ir}{2\pi a^2}\;(r<a),\qquad H=\frac{I}{2\pi r}\;(a<r<b),\qquad H=0\;(r>b)`,
      },
      {
        hint: "Energía por unidad de longitud",
        tex: T`\frac{W_M}{h}=\frac{\mu I^2}{16\pi}+\frac{\mu I^2}{4\pi}\ln\frac ba`,
      },
      {
        hint: "$L'=2W_M/(hI^2)$",
        tex: T`L'=\frac{\mu}{8\pi}+\frac{\mu}{2\pi}\ln\frac ba=${n(coaxInductancePerLength((p.a ?? 1) / 1000, (p.b ?? 2) / 1000) * 1e9)}\,\mathrm{nH/m}`,
        body: "El primer término es la inductancia interna del conductor macizo; el segundo, la externa.",
      },
    ],
  },
  {
    id: "g37",
    group: "guia",
    source: "Guía · 37",
    title: "Línea de dos alambres: inductancia interna y externa",
    note: EXAMPLE,
    original: { a: 1, d: 10 },
    vary: (r) => ({ a: pick(r, [0.5, 1, 2]), d: pick(r, [5, 10, 20]) }),
    statement: (p) =>
      `Calcule las inductancias interna y externa por unidad de longitud de una línea de dos alambres paralelos de radio $a=${p.a}\\,\\mathrm{mm}$, con corrientes opuestas y ejes separados $d=${p.d}\\,\\mathrm{cm}$ ($d\\gg a$).`,
    strategy: {
      prompt:
        "¿Cuánto aporta la inductancia interna de los dos alambres juntos?",
      options: [
        "$\\mu_0/4\\pi$: $\\mu_0/8\\pi$ por cada alambre",
        "$\\mu_0/8\\pi$ en total",
        "Depende de $d$",
        "Es nula si $d\\gg a$",
      ],
      explain:
        "La interna de un alambre macizo es $\\mu_0/8\\pi$ por unidad de longitud, independiente del radio; hay dos alambres.",
    },
    fields: (p) => {
      const l = twoWireInductancePerLength(
        (p.a ?? 1) / 1000,
        (p.d ?? 10) / 100,
      );
      return [
        { label: "L' interna", unit: "nH/m", value: l.internal * 1e9 },
        { label: "L' externa", unit: "nH/m", value: l.external * 1e9 },
      ];
    },
    steps: (p) => {
      const l = twoWireInductancePerLength(
        (p.a ?? 1) / 1000,
        (p.d ?? 10) / 100,
      );
      return [
        {
          hint: "Interna de un alambre macizo",
          tex: T`H=\frac{Ir}{2\pi a^2}\;\Rightarrow\;\frac{W_M}{L}=\frac{\mu_0I^2}{16\pi}\;\Rightarrow\;\frac{\mu_0}{8\pi}\text{ por alambre}`,
          body: `Los dos alambres: $\\mu_0/4\\pi=${n(l.internal * 1e9)}\\,\\mathrm{nH/m}$.`,
        },
        {
          hint: "Externa: flujo entre los alambres",
          tex: T`L'_{ext}=\frac{1}{I}\int_a^{d-a}\left(B_1+B_2\right)dx=\frac{\mu_0}{\pi}\ln\frac{d-a}{a}=${n(l.external * 1e9)}\,\mathrm{nH/m}`,
        },
        {
          hint: "Total",
          tex: T`l=\frac{\mu_0}{4\pi}+\frac{\mu_0}{\pi}\ln\frac{d-a}{a}`,
        },
      ];
    },
  },
  {
    id: "g38",
    group: "guia",
    source: "Guía · 38",
    title: "Fuerza entre dos alambres paralelos",
    note: EXAMPLE,
    original: { I1: 10, I2: 20, d: 5 },
    vary: (r) => ({
      I1: pick(r, [5, 10, 50]),
      I2: pick(r, [10, 20, 100]),
      d: pick(r, [2, 5, 10]),
    }),
    statement: (p) =>
      `Dos alambres paralelos infinitamente largos llevan $I_1=${p.I1}\\,\\mathrm{A}$ e $I_2=${p.I2}\\,\\mathrm{A}$ en la misma dirección, separados $d=${p.d}\\,\\mathrm{cm}$. Determine la fuerza por unidad de longitud.`,
    strategy: {
      prompt: "La fuerza entre los alambres es:",
      options: [
        "De atracción",
        "De repulsión",
        "Nula: el campo de uno es paralelo al otro",
        "Un par, no una fuerza",
      ],
      explain:
        "$d\\vec F_{12}=I_2d\\vec l\\times\\vec B_1$ con $\\hat a_x\\times\\hat a_z=-\\hat a_y$: el alambre 2 es empujado hacia el 1.",
    },
    fields: (p) => [
      {
        label: "F/L",
        unit: "mN/m",
        value:
          ((MU0 * (p.I1 ?? 0) * (p.I2 ?? 0)) /
            (2 * Math.PI * ((p.d ?? 1) / 100))) *
          1e3,
      },
    ],
    steps: (p) => [
      {
        hint: "Campo del alambre 1 en el alambre 2",
        tex: T`\vec B_1=\frac{\mu_0I_1}{2\pi d}\hat a_z`,
      },
      {
        hint: "Fuerza sobre el alambre 2",
        tex: T`d\vec F_{12}=I_2\,d\vec l\times\vec B_1=-\frac{\mu_0I_1I_2}{2\pi d}dx\,\hat a_y`,
      },
      {
        hint: "Por unidad de longitud",
        tex: T`\frac FL=\frac{\mu_0I_1I_2}{2\pi d}=${n(((MU0 * (p.I1 ?? 0) * (p.I2 ?? 0)) / (2 * Math.PI * ((p.d ?? 1) / 100))) * 1e3)}\,\mathrm{mN/m}\;\text{(atracción)}`,
      },
    ],
  },
  {
    id: "g39",
    group: "guia",
    source: "Guía · 39",
    title: "Fuerza y par sobre una espira en B uniforme",
    note: EXAMPLE,
    original: { I: 5, b1: 10, b2: 5, bx: 0.2, by: 0.1 },
    vary: (r) => ({
      I: pick(r, [2, 5, 10]),
      b1: pick(r, [5, 10, 20]),
      b2: pick(r, [5, 10]),
      bx: pick(r, [0.1, 0.2, 0.5]),
      by: pick(r, [0.1, 0.3, 0.4]),
    }),
    statement: (p) =>
      `Una espira rectangular en el plano $xy$, de lados $b_1=${p.b1}\\,\\mathrm{cm}$ y $b_2=${p.b2}\\,\\mathrm{cm}$, lleva $I=${p.I}\\,\\mathrm{A}$ (antihoraria vista desde $+z$) en un campo uniforme $\\vec B=${p.bx}\\hat a_x+${p.by}\\hat a_y+B_z\\hat a_z\\,\\mathrm{T}$. Determine la fuerza neta y las componentes $\\tau_x$, $\\tau_y$ del par.`,
    strategy: {
      prompt: "¿Por qué la fuerza neta es nula en un campo uniforme?",
      options: [
        "Las fuerzas sobre lados opuestos son iguales y opuestas ($\\vec F_3=-\\vec F_1$, $\\vec F_4=-\\vec F_2$)",
        "Porque $\\vec B$ es perpendicular a la espira",
        "Porque la corriente neta es cero",
        "No es nula: depende de $B_z$",
      ],
      explain:
        "$\\oint d\\vec l=0$, entonces $\\vec F=I\\oint d\\vec l\\times\\vec B=0$. Sí hay par: $\\vec\\tau=\\vec m\\times\\vec B$ con $\\vec m=Ib_1b_2\\hat a_z$. $B_z$ no produce par.",
    },
    fields: (p) => {
      const t = loopTorque(
        p.I ?? 0,
        (p.b1 ?? 0) / 100,
        (p.b2 ?? 0) / 100,
        p.bx ?? 0,
        p.by ?? 0,
      );
      return [
        { label: "Fuerza neta", unit: "N", value: 0, absTol: 1e-9 },
        { label: "τx", unit: "mN·m", value: t.tx * 1e3 },
        { label: "τy", unit: "mN·m", value: t.ty * 1e3 },
      ];
    },
    steps: (p) => {
      const t = loopTorque(
        p.I ?? 0,
        (p.b1 ?? 0) / 100,
        (p.b2 ?? 0) / 100,
        p.bx ?? 0,
        p.by ?? 0,
      );
      return [
        {
          hint: "Fuerza en cada lado",
          tex: T`\vec F_1=Ib_1\hat a_x\times\vec B=Ib_1\left(B_y\hat a_z-B_z\hat a_y\right),\quad \vec F_3=-\vec F_1;\qquad \vec F_2=Ib_2\left(B_z\hat a_x-B_x\hat a_z\right),\quad \vec F_4=-\vec F_2`,
          body: "La fuerza neta es cero.",
        },
        {
          hint: "Par con el momento magnético $\\vec m=Ib_1b_2\\hat a_z$",
          tex: T`\vec\tau=\vec m\times\vec B=Ib_1b_2\left(B_x\hat a_y-B_y\hat a_x\right)`,
        },
        {
          hint: "Números",
          tex: T`\tau_x=${n(t.tx * 1e3)}\,\mathrm{mN\cdot m},\qquad \tau_y=${n(t.ty * 1e3)}\,\mathrm{mN\cdot m}`,
        },
      ];
    },
  },
  {
    id: "g42",
    group: "guia",
    source: "Guía · 42",
    title: "Corriente de desplazamiento en un capacitor",
    note:
      "La guía demuestra I_c = C dv/dt y I_D = I_c; el cálculo de H a distancia r (Ampère alrededor del conductor) se completa acá. " +
      EXAMPLE,
    original: { C: 100, V0: 10, f: 1, r: 2 },
    vary: (r) => ({
      C: pick(r, [10, 100, 470]),
      V0: pick(r, [5, 10, 50]),
      f: pick(r, [0.5, 1, 5]),
      r: pick(r, [1, 2, 5]),
    }),
    statement: (p) =>
      `Una fuente $V_c=V_0\\sin\\omega t$ con $V_0=${p.V0}\\,\\mathrm{V}$ y $f=${p.f}\\,\\mathrm{kHz}$ alimenta un capacitor de placas paralelas de $C_1=${p.C}\\,\\mathrm{nF}$. Compruebe que la corriente de desplazamiento entre placas es la de conducción en los alambres y halle $H$ a $r=${p.r}\\,\\mathrm{cm}$ del conductor.`,
    strategy: {
      prompt: "¿Cuánto vale la corriente de desplazamiento entre las placas?",
      options: [
        "La misma que la de conducción en los alambres: $C\\,dv/dt$",
        "Cero: entre las placas no hay corriente",
        "La mitad de la de conducción",
        "$\\varepsilon V_0/d$, sin depender de $\\omega$",
      ],
      explain:
        "$I_D=\\int\\partial\\vec D/\\partial t\\cdot d\\vec s=C\\,dv/dt=I_c$: la corriente total es continua a través del capacitor.",
    },
    fields: (p) => {
      const i = displacementCurrentAmplitude(
        (p.C ?? 0) * 1e-9,
        p.V0 ?? 0,
        2 * Math.PI * (p.f ?? 0) * 1e3,
      );
      return [
        { label: "Amplitud de I", unit: "mA", value: i * 1e3 },
        {
          label: "Amplitud de H a r",
          unit: "mA/m",
          value: (i / (2 * Math.PI * ((p.r ?? 1) / 100))) * 1e3,
        },
      ];
    },
    steps: (p) => {
      const w = 2 * Math.PI * (p.f ?? 0) * 1e3;
      const i = displacementCurrentAmplitude((p.C ?? 0) * 1e-9, p.V0 ?? 0, w);
      return [
        {
          hint: "Desplazamiento entre placas",
          tex: T`\vec D=\varepsilon\vec E=\frac{\varepsilon V_0}{d}\sin\omega t`,
        },
        {
          hint: "Corriente de desplazamiento",
          tex: T`I_D=\int_S\frac{\partial\vec D}{\partial t}\cdot d\vec s=\frac{\varepsilon S}{d}\omega V_0\cos\omega t=C\omega V_0\cos\omega t=C\frac{dv}{dt}=I_c`,
        },
        {
          hint: "Amplitud",
          tex: T`I_0=C\omega V_0=${n(i * 1e3)}\,\mathrm{mA}`,
        },
        {
          hint: "Ampère alrededor del conductor",
          tex: T`H\,2\pi r=I\;\Rightarrow\;H_0=\frac{I_0}{2\pi r}=${n((i / (2 * Math.PI * ((p.r ?? 1) / 100))) * 1e3)}\,\mathrm{mA/m}`,
        },
      ];
    },
  },
  {
    id: "g43",
    group: "guia",
    source: "Guía · 43 y 44",
    title: "f(x − vt) como solución de la onda plana",
    note: EXAMPLE,
    original: { er: 4, mr: 1 },
    vary: (r) => ({ er: pick(r, [1, 4, 9, 16]), mr: pick(r, [1, 2, 4]) }),
    statement: (p) =>
      `Demuestre que $E_y=f(x-vt)$ resuelve la ecuación de ondas planas y halle $v$. Calcúlela para un medio con $\\varepsilon_r=${p.er}$ y $\\mu_r=${p.mr}$.`,
    strategy: {
      prompt:
        "¿Qué condición debe cumplir $v$ para que $f(x-vt)$ sea solución?",
      options: [
        "$\\mu\\varepsilon v^2=1$",
        "$\\mu\\varepsilon v=1$",
        "$v=\\mu\\varepsilon$",
        "Cualquier $v$ sirve",
      ],
      explain:
        "$f''=\\mu\\varepsilon v^2f''$ (la derivada segunda en $t$ trae $v^2$): hay solución no trivial solo si $\\mu\\varepsilon v^2=1$.",
    },
    fields: (p) => [
      {
        label: "Velocidad v",
        unit: "×10⁸ m/s",
        value: C0 / Math.sqrt((p.er ?? 1) * (p.mr ?? 1)) / 1e8,
      },
    ],
    steps: (p) => [
      {
        hint: "Reemplazar en $\\nabla^2\\vec E=\\mu\\varepsilon\\,\\partial^2\\vec E/\\partial t^2$",
        tex: T`f''(x-vt)=\mu\varepsilon\left[(-v)(-v)\right]f''(x-vt)=\mu\varepsilon v^2f''`,
      },
      {
        hint: "Condición",
        tex: T`\mu\varepsilon v^2=1\;\Rightarrow\;v=\frac{1}{\sqrt{\mu\varepsilon}}=\frac{c_0}{\sqrt{\varepsilon_r\mu_r}}=${n(C0 / Math.sqrt((p.er ?? 1) * (p.mr ?? 1)) / 1e8)}\times10^{8}\,\mathrm{m/s}`,
        body: "Vale igual para $f=A\\cos(\\beta x-\\beta vt)$ (ejercicio 44): $-\\beta^2f=-\\mu\\varepsilon\\beta^2v^2f$.",
      },
    ],
  },
  {
    id: "g47",
    group: "guia",
    source: "Guía · 47",
    title: "Ondas de radio en el agua (submarino)",
    original: { rho: 0.2, f1: 30, f2: 30, k: 10 },
    vary: (r) => ({
      rho: pick(r, [0.2, 0.25, 0.3]),
      f1: pick(r, [10, 30, 100]),
      f2: pick(r, [10, 30, 50]),
      k: pick(r, [10, 100]),
    }),
    statement: (p) =>
      `Calcule a qué distancia debe propagarse una onda en el agua ($\\varepsilon_r=81$, $1/\\sigma=${p.rho}\\,\\Omega\\mathrm{m}$) para que la intensidad de campo se reduzca a $1/${p.k}$ de su valor inicial, para $f=${p.f1}\\,\\mathrm{kHz}$ y $f=${p.f2}\\,\\mathrm{MHz}$.`,
    strategy: {
      prompt:
        "¿Por qué se puede usar $\\alpha\\approx\\sqrt{\\pi f\\mu\\sigma}$ en el agua de mar?",
      options: [
        "Porque $\\sigma/\\omega\\varepsilon\\gg1$ a esas frecuencias: buen conductor",
        "Porque $\\varepsilon_r=81$ la vuelve dieléctrico",
        "Porque $\\alpha=\\beta$ siempre",
        "No se puede: hay que usar el α exacto",
      ],
      explain:
        "Con $\\sigma=5\\,\\mathrm{S/m}$ el cociente es $\\sim10^4$ a 30 kHz y $\\sim40$ a 30 MHz.",
    },
    fields: (p) => {
      const s = 1 / (p.rho ?? 1);
      const pct = 100 * (1 - 1 / (p.k ?? 10));
      return [
        {
          label: `x a ${p.f1} kHz`,
          unit: "m",
          value: attenuationDistance(
            alphaGoodConductor(s, (p.f1 ?? 1) * 1e3),
            pct,
          ),
        },
        {
          label: `x a ${p.f2} MHz`,
          unit: "cm",
          value:
            attenuationDistance(alphaGoodConductor(s, (p.f2 ?? 1) * 1e6), pct) *
            100,
        },
      ];
    },
    steps: (p) => {
      const s = 1 / (p.rho ?? 1);
      const pct = 100 * (1 - 1 / (p.k ?? 10));
      const a1 = alphaGoodConductor(s, (p.f1 ?? 1) * 1e3);
      const a2 = alphaGoodConductor(s, (p.f2 ?? 1) * 1e6);
      return [
        {
          hint: "Condición de atenuación",
          tex: T`\frac{E(x)}{E_M}=e^{-\alpha x}=\frac1{${p.k}}\;\Rightarrow\;x=\frac{\ln ${p.k}}{\alpha}`,
        },
        {
          hint: `Frecuencia de ${p.f1} kHz`,
          tex: T`\alpha=\sqrt{\pi f\mu_0\sigma}=${n(a1)}\,\mathrm{Np/m}\;\Rightarrow\;x=${n(attenuationDistance(a1, pct))}\,\mathrm{m}`,
        },
        {
          hint: `Frecuencia de ${p.f2} MHz`,
          tex: T`\alpha=${n(a2)}\,\mathrm{Np/m}\;\Rightarrow\;x=${n(attenuationDistance(a2, pct) * 100)}\,\mathrm{cm}`,
          body: "A mayor frecuencia, mucha más atenuación: por eso los submarinos reciben en frecuencias muy bajas.",
        },
      ];
    },
  },
  {
    id: "g48",
    group: "guia",
    source: "Guía · 48",
    title: "Corriente de conducción vs de desplazamiento",
    original: { sigma: 5, E0: 250, w: 1e10 },
    vary: (r) => ({
      sigma: pick(r, [1, 2, 5, 10]),
      E0: pick(r, [100, 250, 500]),
      w: pick(r, [1e9, 1e10, 5e10]),
    }),
    statement: (p) =>
      `En un material con $\\sigma=${p.sigma}\\,\\mathrm{S/m}$ y $\\varepsilon_r=1$ el campo es $E=${p.E0}\\sin(${n(p.w ?? 0)}\\,t)\\,\\mathrm{V/m}$. Halle las amplitudes de las densidades de corriente de conducción y de desplazamiento, y la frecuencia para la que resultan iguales.`,
    strategy: {
      prompt: "¿Cómo están desfasadas $J_c$ y $J_d$?",
      options: [
        "90°: $J_c\\propto\\sin\\omega t$ y $J_d\\propto\\cos\\omega t$",
        "En fase",
        "180°",
        "No están relacionadas",
      ],
      explain:
        "$J_c=\\sigma E$ sigue a $E$; $J_d=\\varepsilon\\,\\partial E/\\partial t$ lo deriva, y deriva un seno en un coseno.",
    },
    fields: (p) => [
      {
        label: "Amplitud de J conducción",
        unit: "A/m²",
        value: (p.sigma ?? 0) * (p.E0 ?? 0),
      },
      {
        label: "Amplitud de J desplazamiento",
        unit: "A/m²",
        value: EPS0 * (p.w ?? 0) * (p.E0 ?? 0),
      },
      {
        label: "Frecuencia de igualdad",
        unit: "GHz",
        value: (p.sigma ?? 0) / (2 * Math.PI * EPS0) / 1e9,
      },
    ],
    steps: (p) => [
      {
        hint: "Conducción",
        tex: T`J_c=\sigma E=${n((p.sigma ?? 0) * (p.E0 ?? 0))}\sin(\omega t)\,\mathrm{A/m^2}`,
      },
      {
        hint: "Desplazamiento",
        tex: T`J_d=\varepsilon\frac{\partial E}{\partial t}=\varepsilon\omega E_0\cos\omega t=${n(EPS0 * (p.w ?? 0) * (p.E0 ?? 0))}\cos(\omega t)\,\mathrm{A/m^2}`,
      },
      {
        hint: "Igualar amplitudes",
        tex: T`\sigma=\omega\varepsilon\;\Rightarrow\;f=\frac{\sigma}{2\pi\varepsilon}=${n((p.sigma ?? 0) / (2 * Math.PI * EPS0) / 1e9)}\,\mathrm{GHz}`,
      },
    ],
  },
  {
    id: "g49",
    group: "guia",
    source: "Guía · 49",
    title: "Onda plana en un dieléctrico: β, v y H",
    note: "La guía calcula β y v; la amplitud de H (último campo) se completa acá con η = η₀/√ε_r.",
    original: { E0: 5, w: 1e9, er: 9 },
    vary: (r) => ({
      E0: pick(r, [2, 5, 10]),
      w: pick(r, [5e8, 1e9, 2e9]),
      er: pick(r, [4, 9, 16]),
    }),
    statement: (p) =>
      `Con las ecuaciones de Maxwell en forma compleja, halle el campo magnético asociado a $\\vec E=${p.E0}\\cos(${n(p.w ?? 0)}\\,t-\\beta x)\\hat a_y\\,\\mathrm{V/m}$ en un dieléctrico con $\\mu=\\mu_0$ y $\\varepsilon=${p.er}\\varepsilon_0$. Determine $\\beta$, la velocidad de propagación y la amplitud de $H$.`,
    strategy: {
      prompt:
        "En un dieléctrico ideal, ¿cuánto vale la constante de atenuación α?",
      options: [
        "Cero: $\\sigma=0$ y $\\Gamma=j\\omega\\sqrt{\\mu\\varepsilon}$",
        "$\\omega\\sqrt{\\mu\\varepsilon}$",
        "$\\sqrt{\\omega\\mu\\sigma/2}$",
        "Depende de $\\varepsilon_r$",
      ],
      explain:
        "$\\Gamma^2=-\\omega^2\\mu\\varepsilon$ es real negativo, entonces $\\Gamma$ es imaginario puro: $\\alpha=0$ y $\\beta=\\omega\\sqrt{\\mu\\varepsilon}$.",
    },
    fields: (p) => {
      const sq = Math.sqrt(p.er ?? 1);
      const eta = Math.sqrt(MU0 / EPS0) / sq;
      return [
        { label: "β", unit: "rad/m", value: ((p.w ?? 0) * sq) / C0 },
        { label: "Velocidad v", unit: "×10⁸ m/s", value: C0 / sq / 1e8 },
        {
          label: "Amplitud de H",
          unit: "mA/m",
          value: ((p.E0 ?? 0) / eta) * 1e3,
        },
      ];
    },
    steps: (p) => {
      const sq = Math.sqrt(p.er ?? 1);
      const eta = Math.sqrt(MU0 / EPS0) / sq;
      return [
        {
          hint: "Constante de propagación del dieléctrico ideal",
          tex: T`\Gamma^2=-\omega^2\mu\varepsilon\;\Rightarrow\;\Gamma=j\omega\sqrt{\mu_0\,${p.er}\varepsilon_0}=j\beta\;\Rightarrow\;\beta=${n(sq)}\,\frac{\omega}{c_0}=${n(((p.w ?? 0) * sq) / C0)}\,\mathrm{rad/m}`,
        },
        {
          hint: "Velocidad de propagación",
          tex: T`v=\frac{\omega}{\beta}=\frac{c_0}{${n(sq)}}=${n(C0 / sq / 1e8)}\times10^8\,\mathrm{m/s}`,
        },
        {
          hint: "Campo H (completado)",
          tex: T`\eta=\frac{\eta_0}{\sqrt{\varepsilon_r}}=${n(eta)}\,\Omega\;\Rightarrow\;\vec H=\frac{E_0}{\eta}\cos(\omega t-\beta x)\hat a_z,\quad H_0=${n(((p.E0 ?? 0) / eta) * 1e3)}\,\mathrm{mA/m}`,
          body: "E sobre $\\hat a_y$ y propagación en $+x$: $\\vec H$ sobre $+\\hat a_z$ ($\\hat a_y\\times\\hat a_z=\\hat a_x$) y en fase con $\\vec E$.",
        },
      ];
    },
  },
  {
    id: "g50",
    group: "guia",
    source: "Guía · 50",
    title: "Grafito: conductividad y atenuación",
    original: { d1: 0.16, f1: 100, f2: 1, az: 3.45 },
    vary: (r) => ({
      d1: pick(r, [0.1, 0.16, 0.3]),
      f1: pick(r, [50, 100, 200]),
      f2: pick(r, [0.5, 1, 2]),
      az: pick(r, [2.3, 3.45, 4.6]),
    }),
    statement: (p) =>
      `Si la profundidad de penetración del grafito a ${p.f1} MHz es $${p.d1}\\,\\mathrm{mm}$, determine la conductividad y la distancia que se propaga una onda de ${p.f2} GHz antes de que su campo se reduzca según $\\alpha z=${p.az}$.`,
    strategy: {
      prompt: "¿Cómo cambia la profundidad de penetración con la frecuencia?",
      options: [
        "Disminuye como $1/\\sqrt f$",
        "Aumenta como $\\sqrt f$",
        "Disminuye como $1/f$",
        "No depende de la frecuencia",
      ],
      explain:
        "$\\delta=1/\\sqrt{\\pi f\\mu\\sigma}$: subir 10× la frecuencia reduce $\\delta$ unas 3,16×.",
    },
    fields: (p) => {
      const sigma = conductivityFromDepth(
        (p.d1 ?? 1) * 1e-3,
        (p.f1 ?? 1) * 1e6,
      );
      const d2 = (p.d1 ?? 1) * Math.sqrt((p.f1 ?? 1) / ((p.f2 ?? 1) * 1e3));
      return [
        { label: "Conductividad σ", unit: "×10⁴ S/m", value: sigma / 1e4 },
        { label: "Distancia z", unit: "mm", value: (p.az ?? 0) * d2 },
      ];
    },
    steps: (p) => {
      const sigma = conductivityFromDepth(
        (p.d1 ?? 1) * 1e-3,
        (p.f1 ?? 1) * 1e6,
      );
      const d2 = (p.d1 ?? 1) * Math.sqrt((p.f1 ?? 1) / ((p.f2 ?? 1) * 1e3));
      return [
        {
          hint: "Conductividad desde $\\delta=1/\\alpha$",
          tex: T`\sigma=\frac{1}{\pi f\mu_0\delta^2}=${n(sigma / 1e4)}\times10^4\,\mathrm{S/m}`,
        },
        {
          hint: "Verificar buen conductor",
          tex: T`\frac{\sigma}{\omega\varepsilon_0}\approx${n(lossRatio(sigma, (p.f2 ?? 1) * 1e9))}\gg1`,
        },
        {
          hint: "Escalar $\\delta\\propto1/\\sqrt f$",
          tex: T`\delta_2=\delta_1\sqrt{\frac{f_1}{f_2}}=${n(d2)}\,\mathrm{mm}`,
        },
        {
          hint: `Distancia con $\\alpha z=${p.az}$`,
          tex: T`z=\frac{\alpha z}{\alpha_2}=\alpha z\cdot\delta_2=${n((p.az ?? 0) * d2)}\,\mathrm{mm}`,
        },
      ];
    },
  },
  {
    id: "g52",
    group: "guia",
    source: "Guía · 52",
    title: "Vector de Poynting en un coaxial en continua",
    note: EXAMPLE,
    original: { V: 100, I: 5, a: 2, b: 6, r: 4 },
    vary: (r) => {
      const a = pick(r, [1, 2, 3]);
      const b = a * pick(r, [2, 3, 4]);
      return {
        V: pick(r, [100, 500, 1000]),
        I: pick(r, [1, 5, 10]),
        a,
        b,
        r: (a + b) / 2,
      };
    },
    statement: (p) =>
      `Un cable coaxial de radios $a=${p.a}\\,\\mathrm{mm}$ y $b=${p.b}\\,\\mathrm{mm}$ transporta corriente continua $I=${p.I}\\,\\mathrm{A}$ con el conductor interno a potencial $V=${p.V}\\,\\mathrm{V}$. Calcule el módulo del vector de Poynting en el aislante a $r=${p.r}\\,\\mathrm{mm}$ y la potencia total que fluye por el dieléctrico.`,
    strategy: {
      prompt: "¿Hacia dónde apunta el vector de Poynting en el dieléctrico?",
      options: [
        "A lo largo del cable ($\\hat a_z$): la energía viaja por el aislante, no dentro del conductor",
        "Radialmente hacia afuera",
        "Azimutal, siguiendo las líneas de $\\vec H$",
        "Es nulo en el aislante",
      ],
      explain:
        "$\\vec E$ es radial y $\\vec H$ azimutal, entonces $\\vec E\\times\\vec H$ es axial. Dentro del conductor $\\vec P$ es radial entrante y entrega $I^2R$.",
    },
    fields: (p) => [
      {
        label: "|P| a r",
        unit: "kW/m²",
        value:
          coaxPoynting(
            p.V ?? 0,
            p.I ?? 0,
            (p.a ?? 1) / 1000,
            (p.b ?? 2) / 1000,
            (p.r ?? 1) / 1000,
          ) / 1e3,
      },
      {
        label: "Potencia total ∮P·ds",
        unit: "W",
        value: (p.V ?? 0) * (p.I ?? 0),
      },
    ],
    steps: (p) => [
      {
        hint: "Campos en el aislante ($a<r<b$)",
        tex: T`\vec E=\frac{V}{r\ln(b/a)}\hat a_r,\qquad \vec H=\frac{I}{2\pi r}\hat a_\theta`,
      },
      {
        hint: "Poynting",
        tex: T`\vec P=\vec E\times\vec H=\frac{VI}{2\pi r^2\ln(b/a)}\hat a_z=${n(coaxPoynting(p.V ?? 0, p.I ?? 0, (p.a ?? 1) / 1000, (p.b ?? 2) / 1000, (p.r ?? 1) / 1000) / 1e3)}\,\mathrm{kW/m^2}`,
      },
      {
        hint: "Flujo a través de la sección",
        tex: T`\oint\vec P\cdot d\vec s=\int_a^b\frac{VI}{2\pi r^2\ln(b/a)}2\pi r\,dr=VI=${n((p.V ?? 0) * (p.I ?? 0))}\,\mathrm{W}`,
        body: "En el conductor interno $\\vec P$ entra radialmente y vale $\\oint\\vec P\\cdot d\\vec s=I^2R$ (Joule). Fuera del cable, $E=H=0$ y $\\vec P=0$.",
      },
    ],
  },
];
