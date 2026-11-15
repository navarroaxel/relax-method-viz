import {
  cableMultiLayer,
  cableSingleLayer,
  coaxLeakResistance,
  coaxPotential,
  connectedSpheres,
  cylCapacitance,
  diskAxisField,
  groundVoltage,
  lineOverGroundC,
  planeCharge,
  plateCapacitance,
  plateForce,
  pointInShell,
  quarterWasherResistance,
  relaxationTime,
  shellField,
  sphericalShellPotential,
  stormLine,
  texNum,
  twoWireLeak,
  uniformSphereField,
  wedgePotential,
} from "@/lib/teoriaExercises";

import type { Exercise } from "./exercises";

const T = String.raw;
const n = (x: number) => texNum(x);
const pick = <X>(rand: () => number, xs: readonly X[]): X =>
  xs[Math.floor(rand() * xs.length)] as X;
const deg = (x: number) => (x * Math.PI) / 180;
const EXAMPLE =
  "Los datos numéricos son un ejemplo: en la guía el ejercicio es simbólico.";

/** Ejercicios 1 al 24 de la guía, resueltos como en el PDF. */
export const GUIA1: Exercise[] = [
  {
    id: "g1",
    group: "guia1",
    source: "Guía · 1",
    title: "Plano de carga infinito",
    note: EXAMPLE,
    original: { rho: 10 },
    vary: (r) => ({ rho: pick(r, [1, 5, 10, 50]) }),
    statement: (p) =>
      `Determine la intensidad de campo eléctrico de un plano de carga infinito con densidad superficial uniforme $\\rho_S=${p.rho}\\,\\mathrm{nC/m^2}$.`,
    strategy: {
      prompt: "¿Qué superficie gaussiana conviene?",
      options: [
        "Un cilindro que atraviesa el plano: el flujo sale solo por las dos tapas",
        "Una esfera centrada en el plano",
        "Un cubo con una cara sobre el plano",
        "Ninguna: no hay simetría suficiente para usar Gauss",
      ],
      explain:
        "Por simetría $\\vec E$ es normal al plano y de igual módulo a ambos lados: en la pastilla cilíndrica el flujo lateral es nulo y el de las dos tapas vale $2EA$.",
    },
    fields: (p) => [
      { label: "E", unit: "V/m", value: planeCharge((p.rho ?? 0) * 1e-9) },
    ],
    steps: (p) => [
      {
        hint: "Ley de Gauss con una pastilla de área $A$",
        tex: T`\oint_S\vec E\cdot d\vec s=\frac Q{\varepsilon_0},\qquad Q=\rho_SA\;\Rightarrow\;2EA=\frac{\rho_SA}{\varepsilon_0}`,
      },
      {
        hint: "Campo (independiente de la distancia)",
        tex: T`\vec E=\pm\frac{\rho_S}{2\varepsilon_0}\hat a_z\;(z\gtrless0)\;\Rightarrow\;E=${n(planeCharge((p.rho ?? 0) * 1e-9))}\,\mathrm{V/m}`,
      },
    ],
  },
  {
    id: "g2",
    group: "guia1",
    source: "Guía · 2",
    title: "Nube esférica de electrones",
    note: EXAMPLE,
    original: { rho0: 1, b: 10, rin: 5, rout: 20 },
    vary: (r) => ({
      rho0: pick(r, [0.5, 1, 2]),
      b: pick(r, [5, 10, 20]),
      rin: pick(r, [2, 3, 4]),
      rout: pick(r, [25, 30, 40]),
    }),
    statement: (p) =>
      `Una nube esférica de electrones tiene densidad volumétrica $\\rho_V=-\\rho_0$ para $0\\le r\\le b$ y $\\rho_V=0$ para $r>b$, con $\\rho_0=${p.rho0}\\,\\mathrm{\\mu C/m^3}$ y $b=${p.b}\\,\\mathrm{cm}$. Halle $|\\vec E|$ a $r=${p.rin}\\,\\mathrm{cm}$ y a $r=${p.rout}\\,\\mathrm{cm}$.`,
    strategy: {
      prompt: "Dentro de la nube ($r<b$), ¿cómo varía $|E|$ con $r$?",
      options: [
        "Linealmente: la carga encerrada crece como $r^3$ y el área como $r^2$",
        "Como $1/r^2$",
        "Es constante",
        "Es nulo",
      ],
      explain:
        "$Q_{enc}=-\\tfrac43\\pi\\rho_0r^3$ y $4\\pi r^2E=Q_{enc}/\\varepsilon_0$, entonces $E\\propto r$. Afuera, con $Q$ total, $E\\propto1/r^2$. $\\vec E$ apunta hacia el centro porque la carga es negativa.",
    },
    fields: (p) => [
      {
        label: "|E| dentro",
        unit: "kV/m",
        value:
          uniformSphereField(
            (p.rho0 ?? 0) * 1e-6,
            (p.b ?? 1) / 100,
            (p.rin ?? 0) / 100,
          ) / 1e3,
      },
      {
        label: "|E| fuera",
        unit: "kV/m",
        value:
          uniformSphereField(
            (p.rho0 ?? 0) * 1e-6,
            (p.b ?? 1) / 100,
            (p.rout ?? 0) / 100,
          ) / 1e3,
      },
    ],
    steps: (p) => {
      const rho = (p.rho0 ?? 0) * 1e-6;
      const b = (p.b ?? 1) / 100;
      return [
        {
          hint: "Carga encerrada dentro de $r\\le b$",
          tex: T`Q=\int_V\rho_V\,dV=-\rho_0\int_0^r4\pi r'^2dr'=-\tfrac43\pi\rho_0r^3`,
        },
        {
          hint: "Gauss dentro",
          tex: T`E(r)\,4\pi r^2=\frac Q{\varepsilon_0}\;\Rightarrow\;\vec E=-\frac{\rho_0r}{3\varepsilon_0}\hat a_r=-${n(uniformSphereField(rho, b, (p.rin ?? 0) / 100) / 1e3)}\,\mathrm{kV/m}`,
        },
        {
          hint: "Gauss fuera ($Q=-\\tfrac43\\pi\\rho_0b^3$)",
          tex: T`\vec E=-\frac{\rho_0b^3}{3\varepsilon_0r^2}\hat a_r=-${n(uniformSphereField(rho, b, (p.rout ?? 0) / 100) / 1e3)}\,\mathrm{kV/m}`,
        },
      ];
    },
  },
  {
    id: "g3",
    group: "guia1",
    source: "Guía · 3",
    title: "Capa esférica cargada: E(r)",
    note: EXAMPLE,
    original: { Q: 1, b: 10, r: 20 },
    vary: (r) => ({
      Q: pick(r, [1, 2, 5]),
      b: pick(r, [5, 10, 20]),
      r: pick(r, [25, 30, 50]),
    }),
    statement: (p) =>
      `Una carga $Q=${p.Q}\\,\\mathrm{nC}$ se distribuye uniformemente sobre una capa esférica muy delgada de radio $b=${p.b}\\,\\mathrm{cm}$ en el aire. Encuentre $E$ dentro, en la superficie y a $r=${p.r}\\,\\mathrm{cm}$, y represente $|E|=f(r)$.`,
    strategy: {
      prompt: "¿Cuánto vale $E$ dentro de la capa ($r<b$)?",
      options: [
        "Cero: la superficie gaussiana no encierra carga",
        "$Q/(4\\pi\\varepsilon_0b^2)$, igual que en la superficie",
        "Crece linealmente con $r$",
        "Depende de $Q$ y decae como $1/r^2$",
      ],
      explain:
        "Toda la carga está en la capa: dentro $Q_{enc}=0$. Afuera es el campo de una carga puntual. En $r=b$ hay un salto de $\\rho_S/\\varepsilon_0$.",
    },
    fields: (p) => [
      {
        label: "E en la superficie",
        unit: "V/m",
        value: shellField(
          (p.Q ?? 0) * 1e-9,
          (p.b ?? 1) / 100,
          (p.b ?? 1) / 100,
        ),
      },
      {
        label: "E a r",
        unit: "V/m",
        value: shellField(
          (p.Q ?? 0) * 1e-9,
          (p.b ?? 1) / 100,
          (p.r ?? 1) / 100,
        ),
      },
    ],
    steps: (p) => [
      {
        hint: "Gauss con una esfera de radio $r$",
        tex: T`\oint_S\vec E\cdot d\vec s=\frac Q{\varepsilon_0}\;\Rightarrow\;E(r)\,4\pi r^2=\frac Q{\varepsilon_0}`,
      },
      {
        hint: "Resultado por tramos",
        tex: T`\vec E(r)=\begin{cases}0,&r<b\\[2pt]\dfrac{Q}{4\pi\varepsilon_0r^2}\hat a_r,&r>b\end{cases}`,
      },
      {
        hint: "Números",
        tex: T`E(b)=${n(shellField((p.Q ?? 0) * 1e-9, (p.b ?? 1) / 100, (p.b ?? 1) / 100))}\,\mathrm{V/m},\quad E(${p.r}\,\mathrm{cm})=${n(shellField((p.Q ?? 0) * 1e-9, (p.b ?? 1) / 100, (p.r ?? 1) / 100))}\,\mathrm{V/m}`,
      },
    ],
  },
  {
    id: "g4",
    group: "guia1",
    source: "Guía · 4",
    title: "Campo en el eje de un disco cargado",
    note: EXAMPLE,
    original: { rho: 10, b: 10, z: 5 },
    vary: (r) => ({
      rho: pick(r, [5, 10, 50]),
      b: pick(r, [5, 10, 20]),
      z: pick(r, [2, 5, 10, 30]),
    }),
    statement: (p) =>
      `Obtenga la intensidad de campo eléctrico en el eje de un disco circular de radio $b=${p.b}\\,\\mathrm{cm}$ con densidad superficial uniforme $\\rho_S=${p.rho}\\,\\mathrm{nC/m^2}$, a una distancia $z=${p.z}\\,\\mathrm{cm}$ del disco.`,
    strategy: {
      prompt:
        "Al sumar los aportes de todos los anillos, ¿qué componente sobrevive?",
      options: [
        "La axial: las componentes transversales se cancelan por simetría",
        "La radial: las axiales se cancelan",
        "Ninguna: el campo en el eje es nulo",
        "Las dos, en partes iguales",
      ],
      explain:
        "Para cada elemento de carga hay otro diametralmente opuesto cuya componente transversal es contraria: solo queda $E_z$.",
    },
    fields: (p) => [
      {
        label: "E en el eje",
        unit: "V/m",
        value: diskAxisField(
          (p.rho ?? 0) * 1e-9,
          (p.b ?? 1) / 100,
          (p.z ?? 0) / 100,
        ),
      },
      {
        label: "Límite del plano ($b\\to\\infty$)",
        unit: "V/m",
        value: planeCharge((p.rho ?? 0) * 1e-9),
      },
    ],
    steps: (p) => [
      {
        hint: "Vector $\\vec R$ de la fuente al punto y simetría",
        tex: T`\vec E=\frac{\rho_S}{4\pi\varepsilon_0}\int_S\frac{\hat R}{R^2}ds,\quad \hat R=\frac{(-r\cos\phi,-r\sin\phi,z)}{\sqrt{r^2+z^2}}`,
        body: "Las componentes $x$ e $y$ se anulan al integrar en $\\phi$.",
      },
      {
        hint: "Componente axial",
        tex: T`E_z=\frac{\rho_Sz}{2\varepsilon_0}\int_0^b\frac{r\,dr}{\left(r^2+z^2\right)^{3/2}}=\frac{\rho_S}{2\varepsilon_0}\left[1-\frac{z}{\sqrt{b^2+z^2}}\right]\;(z>0)`,
      },
      {
        hint: "Números",
        tex: T`E=${n(diskAxisField((p.rho ?? 0) * 1e-9, (p.b ?? 1) / 100, (p.z ?? 0) / 100))}\,\mathrm{V/m}`,
        body: "Si $b\\to\\infty$ se recupera el plano infinito, $\\rho_S/2\\varepsilon_0$.",
      },
    ],
  },
  {
    id: "g5",
    group: "guia1",
    source: "Guía · 5",
    title: "Carga puntual dentro de una capa conductora",
    note: EXAMPLE,
    original: { Q: 2, Ri: 10, R0: 15, rin: 5, rout: 30 },
    vary: (r) => {
      const ri = pick(r, [8, 10, 12]);
      return {
        Q: pick(r, [1, 2, 5]),
        Ri: ri,
        R0: ri + pick(r, [3, 5, 8]),
        rin: pick(r, [3, 4, 5]),
        rout: pick(r, [25, 30, 40]),
      };
    },
    statement: (p) =>
      `Una carga puntual $Q=${p.Q}\\,\\mathrm{nC}$ está en el centro de una capa esférica conductora de radio interior $R_i=${p.Ri}\\,\\mathrm{cm}$ y exterior $R_0=${p.R0}\\,\\mathrm{cm}$. Determine $E$ y $V$ en función de $R$; calcule $E$ a $${p.rout}\\,\\mathrm{cm}$, $V$ en el conductor y $V$ a $${p.rin}\\,\\mathrm{cm}$ del centro.`,
    strategy: {
      prompt: "¿Por qué $E=0$ dentro del conductor ($R_i\\le r\\le R_0$)?",
      options: [
        "La carga $+Q$ induce $-Q$ en $R_i$: una gaussiana dentro del conductor encierra carga neta nula",
        "Porque el conductor no tiene carga",
        "Porque $V=0$ en el conductor",
        "Porque la carga puntual está lejos",
      ],
      explain:
        "En electrostática el campo en un conductor es nulo: $-Q$ aparece en la cara interior y $+Q$ queda en la exterior. $V$ es constante en el conductor.",
    },
    fields: (p) => {
      const q = (p.Q ?? 0) * 1e-9;
      const ri = (p.Ri ?? 1) / 100;
      const r0 = (p.R0 ?? 2) / 100;
      return [
        {
          label: "E a r exterior",
          unit: "V/m",
          value: pointInShell(q, ri, r0, (p.rout ?? 1) / 100).e,
        },
        {
          label: "V en el conductor",
          unit: "V",
          value: pointInShell(q, ri, r0, (ri + r0) / 2).v,
        },
        {
          label: "V a r interior",
          unit: "V",
          value: pointInShell(q, ri, r0, (p.rin ?? 1) / 100).v,
        },
      ];
    },
    steps: (p) => {
      const q = (p.Q ?? 0) * 1e-9;
      const ri = (p.Ri ?? 1) / 100;
      const r0 = (p.R0 ?? 2) / 100;
      return [
        {
          hint: "Afuera ($r>R_0$): Gauss y $V(\\infty)=0$",
          tex: T`E=\frac Q{4\pi\varepsilon_0r^2},\quad V=\frac Q{4\pi\varepsilon_0r}\;\Rightarrow\;E=${n(pointInShell(q, ri, r0, (p.rout ?? 1) / 100).e)}\,\mathrm{V/m}`,
        },
        {
          hint: "En el conductor ($R_i\\le r\\le R_0$)",
          tex: T`\vec E=0\;\Rightarrow\;V=\text{cte}=\frac Q{4\pi\varepsilon_0R_0}=${n(pointInShell(q, ri, r0, (ri + r0) / 2).v)}\,\mathrm{V}`,
        },
        {
          hint: "Adentro ($r<R_i$): integrar desde $R_i$",
          tex: T`V(r)=\frac Q{4\pi\varepsilon_0}\left(\frac1r-\frac1{R_i}+\frac1{R_0}\right)=${n(pointInShell(q, ri, r0, (p.rin ?? 1) / 100).v)}\,\mathrm{V}`,
          body: "$V$ es continuo en $R_i$ y $R_0$, pero $\\vec E$ salta ahí: el salto es $\\rho_S/\\varepsilon_0$ de la carga superficial inducida.",
        },
      ];
    },
  },
  {
    id: "g6",
    group: "guia1",
    source: "Guía · 6",
    title: "Dos esferas conectadas",
    note: EXAMPLE,
    original: { Q: 10, b1: 2, b2: 6 },
    vary: (r) => {
      const b1 = pick(r, [1, 2, 3]);
      return { Q: pick(r, [5, 10, 20]), b1, b2: b1 * pick(r, [2, 3, 4]) };
    },
    statement: (p) =>
      `Dos esferas conductoras de radios $b_1=${p.b1}\\,\\mathrm{cm}$ y $b_2=${p.b2}\\,\\mathrm{cm}$, muy separadas, están unidas por un alambre. La carga total es $Q=${p.Q}\\,\\mathrm{nC}$. Calcule la carga de cada esfera y el campo en su superficie.`,
    strategy: {
      prompt: "¿Qué se iguala al conectar las esferas con el alambre?",
      options: [
        "Los potenciales: $V_1=V_2$",
        "Las cargas: $Q_1=Q_2$",
        "Los campos en la superficie: $E_1=E_2$",
        "Las densidades superficiales de carga",
      ],
      explain:
        "El alambre hace del sistema un solo conductor equipotencial: $Q_1/b_1=Q_2/b_2$. Entonces $E_1/E_2=b_2/b_1>1$: el campo es más intenso en la esfera pequeña (efecto punta).",
    },
    fields: (p) => {
      const s = connectedSpheres(
        (p.Q ?? 0) * 1e-9,
        (p.b1 ?? 1) / 100,
        (p.b2 ?? 2) / 100,
      );
      return [
        { label: "Q₁", unit: "nC", value: s.q1 * 1e9 },
        { label: "Q₂", unit: "nC", value: s.q2 * 1e9 },
        { label: "E₁", unit: "kV/m", value: s.e1 / 1e3 },
        { label: "E₂", unit: "kV/m", value: s.e2 / 1e3 },
      ];
    },
    steps: (p) => {
      const s = connectedSpheres(
        (p.Q ?? 0) * 1e-9,
        (p.b1 ?? 1) / 100,
        (p.b2 ?? 2) / 100,
      );
      return [
        {
          hint: "Potencial de cada esfera",
          tex: T`V_i=\frac{Q_i}{4\pi\varepsilon_0b_i},\qquad V_1=V_2\;\Rightarrow\;Q_1=\frac{b_1}{b_2}Q_2`,
        },
        {
          hint: "Carga total",
          tex: T`Q=Q_1+Q_2=\frac{b_1+b_2}{b_2}Q_2\;\Rightarrow\;Q_1=${n(s.q1 * 1e9)}\,\mathrm{nC},\;Q_2=${n(s.q2 * 1e9)}\,\mathrm{nC}`,
        },
        {
          hint: "Campo en cada superficie",
          tex: T`E_i=\frac{Q_i}{4\pi\varepsilon_0b_i^2}\;\Rightarrow\;\frac{E_1}{E_2}=\frac{b_2}{b_1}=${n(s.e1 / s.e2)}`,
          body: "Principio del pararrayos: la curvatura alta concentra el campo.",
        },
      ];
    },
  },
  {
    id: "g7",
    group: "guia1",
    source: "Guía · 7",
    title: "Capacidad de placas paralelas",
    note: EXAMPLE,
    original: { er: 4, S: 100, d: 1 },
    vary: (r) => ({
      er: pick(r, [1, 2.5, 4, 10]),
      S: pick(r, [50, 100, 200]),
      d: pick(r, [0.5, 1, 2]),
    }),
    statement: (p) =>
      `Determine la capacidad de un condensador de placas paralelas de área $S=${p.S}\\,\\mathrm{cm^2}$ separadas $d=${p.d}\\,\\mathrm{mm}$, con dieléctrico de $\\varepsilon_r=${p.er}$.`,
    strategy: {
      prompt: "Si se duplica la separación $d$, la capacidad:",
      options: [
        "Se reduce a la mitad",
        "Se duplica",
        "No cambia",
        "Se cuadruplica",
      ],
      explain:
        "$C=\\varepsilon S/d$: es inversamente proporcional a $d$ y directamente a $S$ y $\\varepsilon$.",
    },
    fields: (p) => [
      {
        label: "C",
        unit: "pF",
        value:
          plateCapacitance(p.er ?? 1, (p.S ?? 0) * 1e-4, (p.d ?? 1) * 1e-3) *
          1e12,
      },
    ],
    steps: (p) => [
      {
        hint: "Campo entre placas",
        tex: T`\vec E=\frac{\rho_S}{\varepsilon}\left(-\hat a_y\right)=\frac Q{\varepsilon S}\left(-\hat a_y\right)`,
      },
      {
        hint: "Diferencia de potencial",
        tex: T`V=-\int_0^d\vec E\cdot d\vec l=\frac{Qd}{\varepsilon S}`,
      },
      {
        hint: "Capacidad",
        tex: T`C=\frac QV=\frac{\varepsilon S}{d}=${n(plateCapacitance(p.er ?? 1, (p.S ?? 0) * 1e-4, (p.d ?? 1) * 1e-3) * 1e12)}\,\mathrm{pF}`,
      },
    ],
  },
  {
    id: "g8",
    group: "guia1",
    source: "Guía · 8",
    title: "Capacidad de un condensador cilíndrico",
    note: EXAMPLE,
    original: { er: 2.3, a: 1, b: 3.5, L: 10 },
    vary: (r) => {
      const a = pick(r, [0.5, 1, 2]);
      return {
        er: pick(r, [1, 2.3, 4]),
        a,
        b: a * pick(r, [2, 3.5, 5]),
        L: pick(r, [1, 10, 50]),
      };
    },
    statement: (p) =>
      `Determine la capacidad de un condensador cilíndrico de conductor interno de radio $a=${p.a}\\,\\mathrm{mm}$ y externo de radio $b=${p.b}\\,\\mathrm{mm}$, longitud $L=${p.L}\\,\\mathrm{m}$ y dieléctrico de $\\varepsilon_r=${p.er}$.`,
    strategy: {
      prompt: "¿Cómo depende la capacidad de la relación $b/a$?",
      options: [
        "Disminuye con $\\ln(b/a)$: $C\\propto1/\\ln(b/a)$",
        "Aumenta linealmente con $b/a$",
        "No depende de $b/a$",
        "Es proporcional a $(b-a)$",
      ],
      explain:
        "$V=\\dfrac{Q}{2\\pi\\varepsilon L}\\ln\\dfrac ba$, entonces $C=Q/V=2\\pi\\varepsilon L/\\ln(b/a)$.",
    },
    fields: (p) => [
      {
        label: "C",
        unit: "pF",
        value:
          cylCapacitance(
            p.er ?? 1,
            (p.a ?? 1) / 1000,
            (p.b ?? 2) / 1000,
            p.L ?? 1,
          ) * 1e12,
      },
    ],
    steps: (p) => [
      {
        hint: "Campo entre conductores (Gauss)",
        tex: T`\vec E=\frac{Q}{2\pi\varepsilon rL}\hat a_r,\quad a<r<b`,
      },
      {
        hint: "Tensión",
        tex: T`V=-\int_b^a\vec E\cdot d\vec l=\frac Q{2\pi\varepsilon L}\ln\frac ba`,
      },
      {
        hint: "Capacidad",
        tex: T`C=\frac QV=\frac{2\pi\varepsilon L}{\ln(b/a)}=${n(cylCapacitance(p.er ?? 1, (p.a ?? 1) / 1000, (p.b ?? 2) / 1000, p.L ?? 1) * 1e12)}\,\mathrm{pF}`,
      },
    ],
  },
  {
    id: "g9",
    group: "guia1",
    source: "Guía · 9",
    title: "Energía de un capacitor de placas paralelas",
    note: EXAMPLE,
    original: { er: 1, S: 100, d: 2, V: 500 },
    vary: (r) => ({
      er: pick(r, [1, 2.5, 4]),
      S: pick(r, [50, 100, 200]),
      d: pick(r, [1, 2, 4]),
      V: pick(r, [100, 500, 1000]),
    }),
    statement: (p) =>
      `Encuentre la energía electrostática almacenada en un capacitor de placas paralelas de área $S=${p.S}\\,\\mathrm{cm^2}$ y separación $d=${p.d}\\,\\mathrm{mm}$, cargado a $V=${p.V}\\,\\mathrm{V}$, con $\\varepsilon_r=${p.er}$.`,
    strategy: {
      prompt: "¿Dónde está almacenada la energía?",
      options: [
        "En el campo eléctrico, con densidad $\\tfrac12\\varepsilon E^2$ en todo el volumen entre placas",
        "Solo sobre la superficie de las placas",
        "En los cables que conectan la fuente",
        "No se almacena: se disipa",
      ],
      explain:
        "$W_E=\\int\\tfrac12\\varepsilon E^2dV$ con $E=V/d$ uniforme da $\\tfrac12\\varepsilon\\frac{V^2}{d^2}Sd=\\tfrac12CV^2$.",
    },
    fields: (p) => {
      const c = plateCapacitance(
        p.er ?? 1,
        (p.S ?? 0) * 1e-4,
        (p.d ?? 1) * 1e-3,
      );
      return [
        { label: "C", unit: "pF", value: c * 1e12 },
        { label: "W_E", unit: "µJ", value: 0.5 * c * (p.V ?? 0) ** 2 * 1e6 },
      ];
    },
    steps: (p) => {
      const c = plateCapacitance(
        p.er ?? 1,
        (p.S ?? 0) * 1e-4,
        (p.d ?? 1) * 1e-3,
      );
      return [
        {
          hint: "Campo y capacidad",
          tex: T`\vec E=-\frac Vd\hat a_y,\qquad C=\frac{\varepsilon S}d=${n(c * 1e12)}\,\mathrm{pF}`,
        },
        {
          hint: "Integrar la densidad de energía",
          tex: T`W_E=\int_V\tfrac12\varepsilon E^2dV=\tfrac12\varepsilon\frac{V^2}{d^2}Sd=\tfrac12CV^2`,
        },
        {
          hint: "Números",
          tex: T`W_E=${n(0.5 * c * (p.V ?? 0) ** 2 * 1e6)}\,\mathrm{\mu J}`,
        },
      ];
    },
  },
  {
    id: "g10",
    group: "guia1",
    source: "Guía · 10",
    title: "Capacidad cilíndrica por energía",
    note: EXAMPLE,
    original: { er: 2, a: 1, b: 4, L: 5, Q: 1 },
    vary: (r) => {
      const a = pick(r, [0.5, 1, 2]);
      return {
        er: pick(r, [1, 2, 4]),
        a,
        b: a * pick(r, [2, 4, 6]),
        L: pick(r, [1, 5, 20]),
        Q: pick(r, [0.5, 1, 5]),
      };
    },
    statement: (p) =>
      `Con las fórmulas de energía, halle la capacidad de un capacitor cilíndrico ($a=${p.a}\\,\\mathrm{mm}$, $b=${p.b}\\,\\mathrm{mm}$, $L=${p.L}\\,\\mathrm{m}$, $\\varepsilon_r=${p.er}$) y la energía que almacena con carga $Q=${p.Q}\\,\\mathrm{nC}$.`,
    strategy: {
      prompt: "¿Qué relación permite despejar $C$ a partir de la energía?",
      options: [
        "$W_E=\\tfrac12C\\,\\Delta V^2\;\\Rightarrow\;C=2W_E/\\Delta V^2$",
        "$W_E=C\\,\\Delta V$",
        "$W_E=\\tfrac12C/\\Delta V$",
        "$W_E=Q\\,\\Delta V$ sin factor ½",
      ],
      explain:
        "Se calcula $W_E=\\tfrac12\\int\\varepsilon E^2dV$ y $\\Delta V=\\int E\\,dr$; luego $C=2W_E/\\Delta V^2$ coincide con $2\\pi\\varepsilon L/\\ln(b/a)$.",
    },
    fields: (p) => {
      const c = cylCapacitance(
        p.er ?? 1,
        (p.a ?? 1) / 1000,
        (p.b ?? 2) / 1000,
        p.L ?? 1,
      );
      const q = (p.Q ?? 0) * 1e-9;
      return [
        { label: "C", unit: "pF", value: c * 1e12 },
        {
          label: "W_E con la carga Q",
          unit: "nJ",
          value: ((q * q) / (2 * c)) * 1e9,
        },
      ];
    },
    steps: (p) => {
      const c = cylCapacitance(
        p.er ?? 1,
        (p.a ?? 1) / 1000,
        (p.b ?? 2) / 1000,
        p.L ?? 1,
      );
      const q = (p.Q ?? 0) * 1e-9;
      return [
        {
          hint: "Campo, tensión y energía",
          tex: T`E=\frac Q{2\pi\varepsilon Lr},\quad \Delta V=\frac Q{2\pi\varepsilon L}\ln\frac ba,\quad W_E=\frac12\int\varepsilon E^2dV=\frac{Q^2}{4\pi\varepsilon L}\ln\frac ba`,
        },
        {
          hint: "Capacidad",
          tex: T`C=\frac{2W_E}{\Delta V^2}=\frac{2\pi\varepsilon L}{\ln(b/a)}=${n(c * 1e12)}\,\mathrm{pF}`,
        },
        {
          hint: "Energía con la carga dada",
          tex: T`W_E=\frac{Q^2}{2C}=${n(((q * q) / (2 * c)) * 1e9)}\,\mathrm{nJ}`,
        },
      ];
    },
  },
  {
    id: "g11",
    group: "guia1",
    source: "Guía · 11",
    title: "Fuerza entre las placas de un condensador",
    note: EXAMPLE,
    original: { Q: 10, S: 100 },
    vary: (r) => ({ Q: pick(r, [5, 10, 20]), S: pick(r, [50, 100, 200]) }),
    statement: (p) =>
      `Determine la fuerza sobre las placas de un condensador de placas paralelas en aire, de área $S=${p.S}\\,\\mathrm{cm^2}$, cargado con $Q=${p.Q}\\,\\mathrm{nC}$ (constante) y separado una distancia $x$.`,
    strategy: {
      prompt: "A carga $Q$ constante, ¿de qué depende el módulo de la fuerza?",
      options: [
        "No depende de la separación $x$",
        "Crece como $1/x^2$",
        "Crece linealmente con $x$",
        "Es nula",
      ],
      explain:
        "$W_E=Q^2x/(2\\varepsilon_0S)$ crece linealmente con $x$, entonces $F=-\\partial W_E/\\partial x=-Q^2/(2\\varepsilon_0S)$ es constante y atractiva.",
    },
    fields: (p) => [
      {
        label: "|F|",
        unit: "mN",
        value: plateForce((p.Q ?? 0) * 1e-9, (p.S ?? 1) * 1e-4) * 1e3,
      },
    ],
    steps: (p) => [
      {
        hint: "Energía a $Q$ constante",
        tex: T`W_E=\tfrac12CV^2=\frac{Q^2}{2C}=\frac{Q^2}{2\varepsilon_0S}\,x`,
      },
      {
        hint: "Fuerza como gradiente de la energía",
        tex: T`\vec F=-\nabla W_E=-\frac{\partial W_E}{\partial x}\hat a_x=-\frac{Q^2}{2\varepsilon_0S}\hat a_x`,
        body: "El signo menos indica atracción entre placas.",
      },
      {
        hint: "Número",
        tex: T`|F|=${n(plateForce((p.Q ?? 0) * 1e-9, (p.S ?? 1) * 1e-4) * 1e3)}\,\mathrm{mN}`,
      },
    ],
  },
  {
    id: "g12",
    group: "guia1",
    source: "Guía · 12",
    title: "Potencial y campo en un coaxial",
    note: EXAMPLE,
    original: { V0: 100, a: 2, b: 6, r: 4 },
    vary: (r) => {
      const a = pick(r, [1, 2, 3]);
      const b = a * pick(r, [2, 3, 4]);
      return { V0: pick(r, [50, 100, 500]), a, b, r: (a + b) / 2 };
    },
    statement: (p) =>
      `El conductor interno de un largo cable coaxial (radio $a=${p.a}\\,\\mathrm{mm}$) se mantiene a $V_0=${p.V0}\\,\\mathrm{V}$ y el externo (radio interno $b=${p.b}\\,\\mathrm{mm}$) a $0$. Determine $V$ y $E$ en el aislante a $r=${p.r}\\,\\mathrm{mm}$.`,
    strategy: {
      prompt: "¿Qué forma tiene $V(r)$ en el aislante?",
      options: [
        "Logarítmica: $V=A\\ln r+B$",
        "Lineal en $r$",
        "Proporcional a $1/r$",
        "Constante",
      ],
      explain:
        "Laplace en cilíndricas con $\\partial V/\\partial r\\ne0$: $\\frac d{dr}\\left(r\\frac{dV}{dr}\\right)=0$, entonces $V=A\\ln r+B$ y $E\\propto1/r$.",
    },
    fields: (p) => {
      const c = coaxPotential(
        p.V0 ?? 0,
        (p.a ?? 1) / 1000,
        (p.b ?? 2) / 1000,
        (p.r ?? 1) / 1000,
      );
      return [
        { label: "V(r)", unit: "V", value: c.v },
        { label: "E(r)", unit: "kV/m", value: c.e / 1e3 },
      ];
    },
    steps: (p) => {
      const c = coaxPotential(
        p.V0 ?? 0,
        (p.a ?? 1) / 1000,
        (p.b ?? 2) / 1000,
        (p.r ?? 1) / 1000,
      );
      return [
        {
          hint: "Laplace con simetría cilíndrica",
          tex: T`\nabla^2V=\frac1r\frac d{dr}\left(r\frac{dV}{dr}\right)=0\;\Rightarrow\;V(r)=A\ln r+B`,
        },
        {
          hint: "Condiciones de borde $V(a)=V_0$, $V(b)=0$",
          tex: T`A=\frac{V_0}{\ln(a/b)},\quad B=-A\ln b\;\Rightarrow\;V(r)=\frac{V_0}{\ln(a/b)}\ln\frac rb=${n(c.v)}\,\mathrm{V}`,
        },
        {
          hint: "Campo $\\vec E=-\\nabla V$",
          tex: T`\vec E=\frac{V_0}{r\ln(b/a)}\hat a_r=${n(c.e / 1e3)}\,\mathrm{kV/m}`,
        },
      ];
    },
  },
  {
    id: "g13",
    group: "guia1",
    source: "Guía · 13",
    title: "Planos conductores en cuña",
    note: EXAMPLE,
    original: { V0: 100, alpha: 60, phi1: 30, phi2: 180, r: 5 },
    vary: (r) => {
      const alpha = pick(r, [45, 60, 90, 120]);
      return {
        V0: pick(r, [50, 100, 200]),
        alpha,
        phi1: alpha / 2,
        phi2: (alpha + 360) / 2,
        r: pick(r, [2, 5, 10]),
      };
    },
    statement: (p) =>
      `Dos planos conductores aislados e infinitos, a potenciales $0$ y $V_0=${p.V0}\\,\\mathrm{V}$, forman una cuña (el potencial vale $0$ en $\\phi=0$ y $\\phi=2\\pi$, y $V_0$ en $\\phi=\\alpha=${p.alpha}^\\circ$). Determine $V(\\phi)$ en (a) $0<\\phi<\\alpha$ y (b) $\\alpha<\\phi<2\\pi$; evalúe $V$ en $\\phi=${p.phi1}^\\circ$ y $\\phi=${p.phi2}^\\circ$, y $|E|$ a $r=${p.r}\\,\\mathrm{cm}$ en ambas regiones.`,
    strategy: {
      prompt: "En la cuña, ¿de qué variable depende el potencial?",
      options: [
        "Solo de $\\phi$: $V=C\\phi+K$ en cada región",
        "Solo de $r$",
        "De $r$ y de $\\phi$ por igual",
        "Es constante",
      ],
      explain:
        "Con $\\partial V/\\partial\\phi\\ne0$ y sin dependencia de $r$, Laplace da $\\partial^2V/\\partial\\phi^2=0$. El campo es azimutal y decae como $1/r$.",
    },
    fields: (p) => {
      const a = deg(p.alpha ?? 60);
      const r = (p.r ?? 1) / 100;
      return [
        {
          label: "V en φ₁ (región a)",
          unit: "V",
          value: wedgePotential(p.V0 ?? 0, a, deg(p.phi1 ?? 0)),
        },
        {
          label: "V en φ₂ (región b)",
          unit: "V",
          value: wedgePotential(p.V0 ?? 0, a, deg(p.phi2 ?? 0)),
        },
        {
          label: "|E| región a a r",
          unit: "V/m",
          value: (p.V0 ?? 0) / (a * r),
        },
        {
          label: "|E| región b a r",
          unit: "V/m",
          value: (p.V0 ?? 0) / ((2 * Math.PI - a) * r),
        },
      ];
    },
    steps: (p) => {
      const a = deg(p.alpha ?? 60);
      const r = (p.r ?? 1) / 100;
      return [
        {
          hint: "Laplace con $\\partial V/\\partial\\phi\\ne0$",
          tex: T`\nabla^2V=\frac1{r^2}\frac{\partial^2V}{\partial\phi^2}=0\;\Rightarrow\;V(\phi)=C\phi+K`,
        },
        {
          hint: "Región (a): $V(0)=0$, $V(\\alpha)=V_0$",
          tex: T`V(\phi)=\frac{V_0}{\alpha}\phi,\qquad \vec E=-\frac{V_0}{\alpha r}\hat a_\phi\;\Rightarrow\;|E|=${n((p.V0 ?? 0) / (a * r))}\,\mathrm{V/m}`,
        },
        {
          hint: "Región (b): $V(\\alpha)=V_0$, $V(2\\pi)=0$",
          tex: T`V(\phi)=\frac{V_0(2\pi-\phi)}{2\pi-\alpha},\qquad \vec E=\frac{V_0}{(2\pi-\alpha)r}\hat a_\phi\;\Rightarrow\;|E|=${n((p.V0 ?? 0) / ((2 * Math.PI - a) * r))}\,\mathrm{V/m}`,
        },
      ];
    },
  },
  {
    id: "g14",
    group: "guia1",
    source: "Guía · 14",
    title: "Potencial entre dos capas esféricas",
    note:
      "En el PDF el signo de la expresión final de V(r) está invertido (da −V₁ en R_i); acá se usa la versión que cumple V(R_i)=V₁ y V(R_0)=V₂. " +
      EXAMPLE,
    original: { V1: 100, V2: 0, Ri: 10, R0: 20, r: 15 },
    vary: (r) => {
      const ri = pick(r, [5, 10, 15]);
      const r0 = ri * pick(r, [2, 3]);
      return {
        V1: pick(r, [50, 100, 200]),
        V2: pick(r, [0, 20]),
        Ri: ri,
        R0: r0,
        r: (ri + r0) / 2,
      };
    },
    statement: (p) =>
      `El espacio entre dos capas esféricas conductoras concéntricas, de radios $R_i=${p.Ri}\\,\\mathrm{cm}$ y $R_0=${p.R0}\\,\\mathrm{cm}$, está lleno de aislante. La capa interior está a $V_1=${p.V1}\\,\\mathrm{V}$ y la exterior a $V_2=${p.V2}\\,\\mathrm{V}$. Determine $V$ y $E$ a $r=${p.r}\\,\\mathrm{cm}$.`,
    strategy: {
      prompt: "¿Qué forma tiene $V(r)$ entre las capas?",
      options: [
        "Hiperbólica: $V=-A/r+B$",
        "Lineal, como entre placas planas",
        "Logarítmica",
        "Constante",
      ],
      explain:
        "Laplace esférico con simetría: $\\frac d{dr}\\left(r^2\\frac{dV}{dr}\\right)=0$, entonces $V=-A/r+B$: cae más rápido cerca de la esfera interior.",
    },
    fields: (p) => {
      const s = sphericalShellPotential(
        p.V1 ?? 0,
        p.V2 ?? 0,
        (p.Ri ?? 1) / 100,
        (p.R0 ?? 2) / 100,
        (p.r ?? 1) / 100,
      );
      return [
        { label: "V(r)", unit: "V", value: s.v },
        { label: "E(r)", unit: "V/m", value: s.e },
      ];
    },
    steps: (p) => {
      const s = sphericalShellPotential(
        p.V1 ?? 0,
        p.V2 ?? 0,
        (p.Ri ?? 1) / 100,
        (p.R0 ?? 2) / 100,
        (p.r ?? 1) / 100,
      );
      return [
        {
          hint: "Laplace con simetría esférica",
          tex: T`\frac1{r^2}\frac d{dr}\left(r^2\frac{dV}{dr}\right)=0\;\Rightarrow\;V(r)=-\frac Ar+B`,
        },
        {
          hint: "Condiciones $V(R_i)=V_1$, $V(R_0)=V_2$",
          tex: T`A=\frac{R_iR_0\,(V_1-V_2)}{R_i-R_0}\ \text{(negativa si }V_1>V_2),\qquad V(r)=V_2+\frac{V_1-V_2}{1/R_i-1/R_0}\left(\frac1r-\frac1{R_0}\right)=${n(s.v)}\,\mathrm{V}`,
        },
        {
          hint: "Campo $\\vec E=-\\nabla V$",
          tex: T`\vec E=\frac{R_iR_0}{R_0-R_i}\frac{V_1-V_2}{r^2}\hat a_r=${n(s.e)}\,\mathrm{V/m}`,
        },
      ];
    },
  },
  {
    id: "g15",
    group: "guia1",
    source: "Guía · 15",
    title: "Capacidad de una línea sobre tierra",
    note:
      "El PDF obtiene C' ≈ 8,504 pF/m, pero 2πε₀/ln(2h/a) con h = 10 m y a = 2 cm da 8,05 pF/m (error de cuenta en el PDF). La tensión V es un dato agregado. " +
      EXAMPLE,
    original: { h: 10, a: 2, V: 100 },
    vary: (r) => ({
      h: pick(r, [5, 10, 15]),
      a: pick(r, [1, 2, 3]),
      V: pick(r, [10, 100, 400]),
    }),
    statement: (p) =>
      `Una línea de transmisión de $${p.a}\\,\\mathrm{cm}$ de radio es paralela a la tierra y está a $h=${p.h}\\,\\mathrm{m}$ sobre ella (plano conductor infinito). Encuentre la capacidad por metro de línea respecto de la tierra y la carga por metro con $V=${p.V}\\,\\mathrm{kV}$.`,
    strategy: {
      prompt: "¿Cómo se trata la tierra como plano conductor?",
      options: [
        "Método de las imágenes: una línea imagen a la misma distancia bajo el suelo con carga opuesta",
        "Se ignora la tierra",
        "Se la reemplaza por otra línea con la misma carga",
        "Como un dieléctrico perfecto",
      ],
      explain:
        "La imagen con $-\\rho_L$ hace que el plano $y=0$ sea equipotencial ($V=0$). Con $h\\gg a$, $V_A=\\frac{\\rho_L}{2\\pi\\varepsilon_0}\\ln\\frac{2h}a$.",
    },
    fields: (p) => {
      const c = lineOverGroundC(p.h ?? 1, (p.a ?? 1) / 100);
      return [
        { label: "C'", unit: "pF/m", value: c * 1e12 },
        { label: "ρ_L", unit: "µC/m", value: c * (p.V ?? 0) * 1e3 * 1e6 },
      ];
    },
    steps: (p) => {
      const c = lineOverGroundC(p.h ?? 1, (p.a ?? 1) / 100);
      return [
        {
          hint: "Campo de una línea y potencial por imágenes",
          tex: T`E=\frac{\rho_L}{2\pi\varepsilon_0r},\qquad V(P)=\frac{\rho_L}{2\pi\varepsilon_0}\ln\frac{r_2}{r_1}`,
        },
        {
          hint: "Potencial del conductor ($h\\gg a$) y de tierra",
          tex: T`V_A=\frac{\rho_L}{2\pi\varepsilon_0}\ln\frac{2h}a,\qquad V_B=0`,
        },
        {
          hint: "Capacidad por unidad de longitud",
          tex: T`C'=\frac{\rho_L}{V}=\frac{2\pi\varepsilon_0}{\ln(2h/a)}=${n(c * 1e12)}\,\mathrm{pF/m}\;\Rightarrow\;\rho_L=C'V=${n(c * (p.V ?? 0) * 1e3 * 1e6)}\,\mathrm{\mu C/m}`,
        },
      ];
    },
  },
  {
    id: "g16",
    group: "guia1",
    source: "Guía · 16",
    title: "Ley de Ohm en un conductor recto",
    note: EXAMPLE,
    original: { sigma: 58, L: 100, S: 2.5, dV: 10 },
    vary: (r) => ({
      sigma: pick(r, [35, 58]),
      L: pick(r, [10, 100, 500]),
      S: pick(r, [1.5, 2.5, 6]),
      dV: pick(r, [5, 10, 24]),
    }),
    statement: (p) =>
      `Demuestre la ley de Ohm para un conductor recto homogéneo de sección constante. Aplíquela a un cable de $\\sigma=${p.sigma}\\,\\mathrm{MS/m}$, longitud $L=${p.L}\\,\\mathrm{m}$ y sección $S=${p.S}\\,\\mathrm{mm^2}$ con $\\Delta V=${p.dV}\\,\\mathrm{V}$.`,
    strategy: {
      prompt:
        "¿Qué hace que $\\vec E$ sea uniforme y axial dentro del conductor?",
      options: [
        "Es recto, homogéneo y de sección constante: la geometría es uniforme",
        "Que el conductor tiene carga neta",
        "Que $\\sigma$ depende de la posición",
        "Que la corriente es alterna",
      ],
      explain:
        "Con $E$ uniforme, $I=\\sigma ES$ y $\\Delta V=EL$, entonces $R=\\Delta V/I=L/(\\sigma S)=\\rho L/S$.",
    },
    fields: (p) => {
      const r = (p.L ?? 1) / ((p.sigma ?? 1) * 1e6 * (p.S ?? 1) * 1e-6);
      return [
        { label: "R", unit: "Ω", value: r },
        { label: "I", unit: "A", value: (p.dV ?? 0) / r },
      ];
    },
    steps: (p) => {
      const r = (p.L ?? 1) / ((p.sigma ?? 1) * 1e6 * (p.S ?? 1) * 1e-6);
      return [
        {
          hint: "Corriente",
          tex: T`\vec J=\sigma\vec E,\qquad I=\int_S\vec J\cdot d\vec s=\sigma ES`,
        },
        {
          hint: "Diferencia de potencial",
          tex: T`\Delta V_{AB}=-\int_A^B\vec E\cdot d\vec l=EL`,
        },
        {
          hint: "Resistencia",
          tex: T`R=\frac{\Delta V}I=\frac{EL}{\sigma ES}=\frac L{\sigma S}=${n(r)}\,\Omega,\qquad I=${n((p.dV ?? 0) / r)}\,\mathrm{A}`,
        },
      ];
    },
  },
  {
    id: "g17",
    group: "guia1",
    source: "Guía · 17",
    title: "Tiempo de relajación: cobre y caucho",
    note: EXAMPLE,
    original: { ec: 3, sg: 1, sc: 5.8 },
    vary: (r) => ({
      ec: pick(r, [2, 3, 4]),
      sg: pick(r, [0.5, 1, 2]),
      sc: pick(r, [3.5, 5.8]),
    }),
    statement: (p) =>
      `Calcule el tiempo de relajación del cobre ($\\varepsilon_r=1$, $\\sigma=${p.sc}\\times10^7\\,\\mathrm{S/m}$) y del caucho ($\\varepsilon_r=${p.ec}$, $\\sigma=${p.sg}\\times10^{-15}\\,\\mathrm{S/m}$).`,
    strategy: {
      prompt: "¿Qué mide el tiempo de relajación $\\tau=\\varepsilon/\\sigma$?",
      options: [
        "Lo que tarda en desaparecer una carga libre dentro del material",
        "El tiempo que tarda en cargarse un capacitor externo",
        "El período de la corriente alterna",
        "La velocidad de los electrones",
      ],
      explain:
        "La carga libre decae como $e^{-t/\\tau}$ con $\\tau=\\varepsilon/\\sigma$: ínfimo en un buen conductor y de horas en un aislante.",
    },
    fields: (p) => [
      {
        label: "τ cobre",
        unit: "×10⁻¹⁹ s",
        value: relaxationTime(1, (p.sc ?? 1) * 1e7) / 1e-19,
      },
      {
        label: "τ caucho",
        unit: "h",
        value: relaxationTime(p.ec ?? 1, (p.sg ?? 1) * 1e-15) / 3600,
      },
    ],
    steps: (p) => [
      {
        hint: "Cobre",
        tex: T`\tau_{Cu}=\frac{\varepsilon_{Cu}}{\sigma_{Cu}}=\frac{\varepsilon_0}{${p.sc}\times10^{7}}=${n(relaxationTime(1, (p.sc ?? 1) * 1e7) / 1e-19)}\times10^{-19}\,\mathrm{s}`,
      },
      {
        hint: "Caucho",
        tex: T`\tau_{caucho}=\frac{${p.ec}\,\varepsilon_0}{${p.sg}\times10^{-15}}=${n(relaxationTime(p.ec ?? 1, (p.sg ?? 1) * 1e-15))}\,\mathrm{s}\approx${n(relaxationTime(p.ec ?? 1, (p.sg ?? 1) * 1e-15) / 3600)}\,\mathrm h`,
      },
    ],
  },
  {
    id: "g18",
    group: "guia1",
    source: "Guía · 18",
    title: "Potencia óhmica en un conductor",
    note: EXAMPLE,
    original: { sigma: 58, L: 100, S: 2.5, I: 5 },
    vary: (r) => ({
      sigma: pick(r, [35, 58]),
      L: pick(r, [10, 100, 500]),
      S: pick(r, [1.5, 2.5, 6]),
      I: pick(r, [2, 5, 16]),
    }),
    statement: (p) =>
      `Demuestre que la potencia óhmica en un conductor de sección constante es $P=I^2R$ y calcúlela para un cable de $\\sigma=${p.sigma}\\,\\mathrm{MS/m}$, $L=${p.L}\\,\\mathrm{m}$, $S=${p.S}\\,\\mathrm{mm^2}$ con $I=${p.I}\\,\\mathrm{A}$.`,
    strategy: {
      prompt: "¿Cómo se obtiene la potencia disipada a partir de los campos?",
      options: [
        "$P=\\int_V\\vec E\\cdot\\vec J\\,dV$",
        "$P=\\int_V\\vec B\\cdot\\vec H\\,dV$",
        "$P=\\oint\\vec E\\cdot d\\vec l$",
        "$P=IR$",
      ],
      explain:
        "$\\vec E\\cdot\\vec J=\\sigma E^2$ es la potencia por unidad de volumen; con $E$ uniforme resulta $\\sigma E^2SL=I^2L/(\\sigma S)=I^2R$.",
    },
    fields: (p) => {
      const r = (p.L ?? 1) / ((p.sigma ?? 1) * 1e6 * (p.S ?? 1) * 1e-6);
      return [
        { label: "R", unit: "Ω", value: r },
        { label: "P", unit: "W", value: (p.I ?? 0) ** 2 * r },
      ];
    },
    steps: (p) => {
      const r = (p.L ?? 1) / ((p.sigma ?? 1) * 1e6 * (p.S ?? 1) * 1e-6);
      return [
        {
          hint: "Corriente y resistencia",
          tex: T`I=\sigma ES,\qquad R=\frac L{\sigma S}=${n(r)}\,\Omega`,
        },
        {
          hint: "Potencia por integración del campo",
          tex: T`P=\int_V\vec E\cdot\vec J\,dV=\int_V\sigma E^2dV=\sigma E^2SL=\frac{I^2L}{\sigma S}=I^2R`,
        },
        {
          hint: "Número",
          tex: T`P=I^2R=${n((p.I ?? 0) ** 2 * r)}\,\mathrm W`,
        },
      ];
    },
  },
  {
    id: "g19",
    group: "guia1",
    source: "Guía · 19",
    title: "Resistencia de fuga de un coaxial",
    note: EXAMPLE,
    original: { a: 1, b: 5, l: 10, sg: 1, dV: 1000 },
    vary: (r) => {
      const a = pick(r, [0.5, 1, 2]);
      return {
        a,
        b: a * pick(r, [3, 5, 8]),
        l: pick(r, [1, 10, 100]),
        sg: pick(r, [0.5, 1, 5]),
        dV: pick(r, [100, 1000]),
      };
    },
    statement: (p) =>
      `Encuentre la resistencia de fuga entre los conductores de un cable coaxial de radios $a=${p.a}\\,\\mathrm{mm}$ y $b=${p.b}\\,\\mathrm{mm}$, longitud $l=${p.l}\\,\\mathrm{m}$, si el aislante tiene $\\sigma=${p.sg}\\,\\mathrm{nS/m}$. Halle también la corriente de fuga con $\\Delta V=${p.dV}\\,\\mathrm V$.`,
    strategy: {
      prompt: "¿Qué relación une $R_f$ con la capacidad del mismo cable?",
      options: [
        "$R_fC=\\varepsilon/\\sigma$",
        "$R_fC=\\sigma/\\varepsilon$",
        "$R_f=C$",
        "$R_f/C=\\varepsilon\\sigma$",
      ],
      explain:
        "Las líneas de $\\vec J$ y de $\\vec D$ coinciden: $R=\\frac{\\ln(b/a)}{2\\pi\\sigma l}$ y $C=\\frac{2\\pi\\varepsilon l}{\\ln(b/a)}$, entonces $RC=\\varepsilon/\\sigma$.",
    },
    fields: (p) => {
      const r = coaxLeakResistance(
        (p.a ?? 1) / 1000,
        (p.b ?? 2) / 1000,
        p.l ?? 1,
        (p.sg ?? 1) * 1e-9,
      );
      return [
        { label: "R_f", unit: "MΩ", value: r / 1e6 },
        { label: "I_f", unit: "µA", value: ((p.dV ?? 0) / r) * 1e6 },
      ];
    },
    steps: (p) => {
      const r = coaxLeakResistance(
        (p.a ?? 1) / 1000,
        (p.b ?? 2) / 1000,
        p.l ?? 1,
        (p.sg ?? 1) * 1e-9,
      );
      return [
        {
          hint: "Capacidad y relación $RC=\\varepsilon/\\sigma$",
          tex: T`C=\frac{2\pi\varepsilon l}{\ln(b/a)},\qquad R_fC=\frac\varepsilon\sigma`,
        },
        {
          hint: "Resistencia de fuga",
          tex: T`R_f=\frac{\varepsilon}{\sigma C}=\frac{\ln(b/a)}{2\pi l\sigma}=${n(r / 1e6)}\,\mathrm{M\Omega}`,
        },
        {
          hint: "Corriente de fuga",
          tex: T`I_f=\frac{\Delta V}{R_f}=\frac{2\pi l\sigma\,\Delta V}{\ln(b/a)}=${n(((p.dV ?? 0) / r) * 1e6)}\,\mathrm{\mu A}`,
        },
      ];
    },
  },
  {
    id: "g20",
    group: "guia1",
    source: "Guía · 20",
    title: "Resistencia de fuga de una línea de dos alambres",
    note: EXAMPLE,
    original: { a: 1, d: 10, sg: 1 },
    vary: (r) => ({
      a: pick(r, [0.5, 1, 2]),
      d: pick(r, [5, 10, 20]),
      sg: pick(r, [0.5, 1, 5]),
    }),
    statement: (p) =>
      `Encuentre la resistencia de fuga por unidad de longitud de una línea de dos alambres paralelos de radio $a=${p.a}\\,\\mathrm{mm}$, con ejes separados $d=${p.d}\\,\\mathrm{cm}$, en un medio de $\\sigma=${p.sg}\\,\\mathrm{nS/m}$. Calcule además la capacidad por unidad de longitud.`,
    strategy: {
      prompt: "¿Cómo se obtiene $R_f$ a partir de $C'$?",
      options: [
        "$R_f'=\\varepsilon/(\\sigma C')$",
        "$R_f'=\\sigma C'/\\varepsilon$",
        "$R_f'=1/C'$",
        "No se puede: hay que integrar $\\vec J$ de nuevo",
      ],
      explain:
        "Como en el coaxial, $RC=\\varepsilon/\\sigma$. Con $C'=\\pi\\varepsilon/\\ln\\frac{d-a}a$ resulta $R_f'=\\frac1{\\pi\\sigma}\\ln\\frac{d-a}a$.",
    },
    fields: (p) => {
      const w = twoWireLeak(
        (p.a ?? 1) / 1000,
        (p.d ?? 10) / 100,
        (p.sg ?? 1) * 1e-9,
      );
      return [
        { label: "C'", unit: "pF/m", value: w.cPerM * 1e12 },
        { label: "R_f'", unit: "GΩ·m", value: w.rLeak / 1e9 },
      ];
    },
    steps: (p) => {
      const w = twoWireLeak(
        (p.a ?? 1) / 1000,
        (p.d ?? 10) / 100,
        (p.sg ?? 1) * 1e-9,
      );
      return [
        {
          hint: "Tensión entre alambres (superposición de dos líneas)",
          tex: T`\Delta V=V_A-V_B=\frac{\rho_L}{\pi\varepsilon}\ln\frac{D}{a}=\frac{\rho_L}{\pi\varepsilon}\ln\frac{d-a}a`,
        },
        {
          hint: "Capacidad por unidad de longitud",
          tex: T`C'=\frac{\rho_L}{\Delta V}=\frac{\pi\varepsilon}{\ln\frac{d-a}a}=${n(w.cPerM * 1e12)}\,\mathrm{pF/m}`,
        },
        {
          hint: "Resistencia de fuga",
          tex: T`R_f'=\frac{\varepsilon}{\sigma C'}=\frac1{\pi\sigma}\ln\frac{d-a}a=${n(w.rLeak / 1e9)}\,\mathrm{G\Omega\cdot m}`,
        },
      ];
    },
  },
  {
    id: "g21",
    group: "guia1",
    source: "Guía · 21",
    title: "Resistencia de un cuarto de arandela",
    note: EXAMPLE,
    original: { sigma: 5.8, h: 2, a: 1, b: 3 },
    vary: (r) => {
      const a = pick(r, [1, 2]);
      return {
        sigma: pick(r, [3.5, 5.8]),
        h: pick(r, [1, 2, 5]),
        a,
        b: a * pick(r, [2, 3, 4]),
      };
    },
    statement: (p) =>
      `Un material conductor de grosor uniforme $h=${p.h}\\,\\mathrm{mm}$ y conductividad $\\sigma=${p.sigma}\\,\\mathrm{MS/m}$ tiene la forma de un cuarto de arandela circular plana, de radio interior $a=${p.a}\\,\\mathrm{cm}$ y exterior $b=${p.b}\\,\\mathrm{cm}$. Determine la resistencia entre las caras de los extremos.`,
    strategy: {
      prompt: "¿Cómo circula la corriente entre las dos caras de los extremos?",
      options: [
        "En arcos, en dirección azimutal $\\hat a_\\phi$",
        "Radialmente, de $a$ a $b$",
        "Verticalmente, a lo largo de $h$",
        "No circula corriente",
      ],
      explain:
        "Con el potencial dependiendo solo de $\\phi$, $\\vec E\\propto-\\hat a_\\phi/r$: la corriente sigue arcos y el área transversal se integra en $r$ y $z$.",
    },
    fields: (p) => [
      {
        label: "R",
        unit: "µΩ",
        value:
          quarterWasherResistance(
            (p.sigma ?? 1) * 1e6,
            (p.h ?? 1) / 1000,
            (p.a ?? 1) / 100,
            (p.b ?? 2) / 100,
          ) * 1e6,
      },
    ],
    steps: (p) => {
      const r = quarterWasherResistance(
        (p.sigma ?? 1) * 1e6,
        (p.h ?? 1) / 1000,
        (p.a ?? 1) / 100,
        (p.b ?? 2) / 100,
      );
      return [
        {
          hint: "Laplace: $V$ solo depende de $\\phi$",
          tex: T`\nabla^2V=\frac1{r^2}\frac{\partial^2V}{\partial\phi^2}=0,\quad V(0)=0,\;V(\tfrac\pi2)=V_0\;\Rightarrow\;V=\frac{2V_0}\pi\phi`,
        },
        {
          hint: "Campo y densidad de corriente",
          tex: T`\vec E=-\frac1r\frac{\partial V}{\partial\phi}\hat a_\phi=\frac{2V_0}{\pi r}\left(-\hat a_\phi\right),\qquad \vec J=\sigma\vec E`,
        },
        {
          hint: "Corriente total a través de una cara",
          tex: T`I=\int_a^b\int_0^h\frac{2\sigma V_0}{\pi r}\,dz\,dr=\frac{2\sigma hV_0}\pi\ln\frac ba`,
        },
        {
          hint: "Resistencia",
          tex: T`R=\frac{V_0}I=\frac{\pi}{2\sigma h\ln(b/a)}=${n(r * 1e6)}\,\mathrm{\mu\Omega}`,
        },
      ];
    },
  },
  {
    id: "g22",
    group: "guia1",
    source: "Guía · 22",
    title: "Línea protegida por un hilo de guarda",
    note:
      "El PDF resuelve en función de E₀ (campo de la nube); acá E₀ es un dato propuesto. " +
      EXAMPLE,
    original: { h: 10, m: 2, d: 8, E0: 10 },
    vary: (r) => ({
      h: pick(r, [8, 10, 12]),
      m: pick(r, [1, 2, 3]),
      d: pick(r, [6, 8, 10]),
      E0: pick(r, [5, 10, 20]),
    }),
    statement: (p) =>
      `Una línea unipolar L a $h=${p.h}\\,\\mathrm{m}$ del suelo está bajo el campo uniforme $E_0=${p.E0}\\,\\mathrm{kV/m}$ entre una nube cargada y tierra (se modela como capacitor plano). Se coloca un hilo conductor M paralelo, de diámetro $${p.d}\\,\\mathrm{mm}$, a $m=${p.m}\\,\\mathrm{m}$ por encima de la línea y conectado a tierra. Determine el potencial en L antes y después de M, y la intensidad de campo sobre M.`,
    strategy: {
      prompt: "¿Cómo se impone que el hilo M esté a tierra?",
      options: [
        "Se suma el potencial del campo uniforme al de la carga $\\rho_L$ de M (y su imagen) y se exige $V_M=0$",
        "Se anula el campo $E_0$",
        "Se supone $\\rho_L=0$ en M",
        "Se iguala el potencial de M al de L",
      ],
      explain:
        "Por superposición, $V_M=(h+m)E_0+\\frac{\\rho_L}{2\\pi\\varepsilon_0}\\ln\\frac{2(h+m)}a=0$ determina $\\rho_L$ (negativa); luego se suma su efecto en L.",
    },
    fields: (p) => {
      const s = stormLine(
        p.h ?? 1,
        p.m ?? 1,
        (p.d ?? 8) / 2000,
        (p.E0 ?? 0) * 1e3,
      );
      return [
        { label: "V_L antes", unit: "kV", value: s.vBefore / 1e3 },
        { label: "V_L después", unit: "kV", value: s.vAfter / 1e3 },
        {
          label: "Reducción",
          unit: "%",
          value: (1 - s.vAfter / s.vBefore) * 100,
        },
        { label: "|E| sobre M", unit: "MV/m", value: Math.abs(s.eM) / 1e6 },
      ];
    },
    steps: (p) => {
      const s = stormLine(
        p.h ?? 1,
        p.m ?? 1,
        (p.d ?? 8) / 2000,
        (p.E0 ?? 0) * 1e3,
      );
      const e0 = (p.E0 ?? 0) * 1e3;
      return [
        {
          hint: "Campo atmosférico: potencial en L sin el hilo",
          tex: T`V_0(y)=yE_0\;\Rightarrow\;V_L^0=hE_0=${n(s.vBefore / 1e3)}\,\mathrm{kV}`,
        },
        {
          hint: "M a tierra (método de imágenes): determinar $\\rho_L$",
          tex: T`V_M=(h+m)E_0+\frac{\rho_L}{2\pi\varepsilon_0}\ln\frac{2(h+m)}a=0\;\Rightarrow\;\frac{\rho_L}{2\pi\varepsilon_0}=${n(s.k / e0)}\,E_0`,
        },
        {
          hint: "Potencial en L por M y su imagen M'",
          tex: T`V_{M\to L}=\frac{\rho_L}{2\pi\varepsilon_0}\ln\frac{2h+m}m=${n((s.k * Math.log((2 * (p.h ?? 1) + (p.m ?? 1)) / (p.m ?? 1))) / 1e3)}\,\mathrm{kV}`,
        },
        {
          hint: "Superposición: potencial total y campo sobre M",
          tex: T`V_L=V_L^0+V_{M\to L}=${n(s.vAfter / 1e3)}\,\mathrm{kV}\ (-${n((1 - s.vAfter / s.vBefore) * 100)}\%),\qquad E_M=\frac{\rho_L}{2\pi\varepsilon_0a}+E_0=${n(s.eM / 1e6)}\,\mathrm{MV/m}`,
        },
      ];
    },
  },
  {
    id: "g23",
    group: "guia1",
    source: "Guía · 23",
    title: "Toma de tierra: tensión de paso",
    note: EXAMPLE,
    original: { I: 200, sg: 10, d1: 2.2, d2: 9.2, step: 0.8 },
    vary: (r) => ({
      I: pick(r, [100, 200, 500]),
      sg: pick(r, [5, 10, 20]),
      d1: pick(r, [1.5, 2.2, 3]),
      d2: pick(r, [6, 9.2, 12]),
      step: pick(r, [0.6, 0.8, 1]),
    }),
    statement: (p) =>
      `Por una falla de aislamiento una línea hace contacto con la torre y se establece una corriente de $${p.I}\\,\\mathrm{A}$ a tierra (conductividad del suelo $\\sigma=${p.sg}\\,\\mathrm{mS/m}$). Determine la distribución de tensiones en la superficie del suelo y la tensión de paso ($${p.step}\\,\\mathrm{m}$) a $${p.d1}\\,\\mathrm{m}$ y a $${p.d2}\\,\\mathrm{m}$ de la torre.`,
    strategy: {
      prompt:
        "¿Cómo cae el potencial del suelo al alejarse de la toma de tierra?",
      options: [
        "Como $1/d$: la corriente se reparte en una semiesfera de área $2\\pi d^2$",
        "Linealmente con $d$",
        "Como $1/d^2$",
        "Es uniforme",
      ],
      explain:
        "$J=I/(2\\pi d^2)$ y $V=\\int E\\,dd=I/(2\\pi\\sigma d)$. La tensión de paso es la diferencia entre dos puntos separados por un paso.",
    },
    fields: (p) => {
      const i = p.I ?? 0;
      const s = (p.sg ?? 1) * 1e-3;
      const step = p.step ?? 1;
      return [
        {
          label: "ΔV de paso a d₁",
          unit: "V",
          value:
            groundVoltage(i, s, p.d1 ?? 1) -
            groundVoltage(i, s, (p.d1 ?? 1) + step),
        },
        {
          label: "ΔV de paso a d₂",
          unit: "V",
          value:
            groundVoltage(i, s, p.d2 ?? 1) -
            groundVoltage(i, s, (p.d2 ?? 1) + step),
        },
        {
          label: "R(d₁) = V/I",
          unit: "Ω",
          value: groundVoltage(i, s, p.d1 ?? 1) / i,
        },
      ];
    },
    steps: (p) => {
      const i = p.I ?? 0;
      const s = (p.sg ?? 1) * 1e-3;
      const step = p.step ?? 1;
      const dv1 =
        groundVoltage(i, s, p.d1 ?? 1) -
        groundVoltage(i, s, (p.d1 ?? 1) + step);
      const dv2 =
        groundVoltage(i, s, p.d2 ?? 1) -
        groundVoltage(i, s, (p.d2 ?? 1) + step);
      return [
        {
          hint: "Densidad de corriente en una semiesfera",
          tex: T`J=\frac I S=\frac I{2\pi d^2}`,
        },
        {
          hint: "Potencial respecto del infinito",
          tex: T`V_P=-\int_\infty^P\vec E\cdot d\vec l=\int_d^\infty\frac{I\,dr}{2\pi\sigma r^2}=\frac I{2\pi\sigma d}`,
        },
        {
          hint: "Tensión de paso entre $d_1$ y $d_2$",
          tex: T`\Delta V=\frac I{2\pi\sigma}\left(\frac1{d_1}-\frac1{d_2}\right)\;\Rightarrow\;${n(dv1)}\,\mathrm V\ \text{a}\ ${p.d1}\,\mathrm m,\quad ${n(dv2)}\,\mathrm V\ \text{a}\ ${p.d2}\,\mathrm m`,
        },
        {
          hint: "Resistencia de la toma",
          tex: T`R_f=\frac{V}{I}=\frac1{2\pi\sigma d}=${n(groundVoltage(i, s, p.d1 ?? 1) / i)}\,\Omega\ (d=${p.d1}\,\mathrm m)`,
        },
      ];
    },
  },
  {
    id: "g24",
    group: "guia1",
    source: "Guía · 24",
    title: "Cable con aislante: capacidad y tensión máxima",
    note:
      "La figura de la guía no está en el PDF resuelto: se interpretan sus rótulos como permitividades relativas (una capa de $\\varepsilon_r=6$, o tres capas de 6, 4 y 2 de adentro hacia afuera). " +
      EXAMPLE,
    original: { a: 0.4, b: 2.4, E: 100 },
    vary: (r) => {
      const a = pick(r, [0.3, 0.4, 0.5]);
      return { a, b: a * pick(r, [6, 8]), E: pick(r, [50, 100, 150]) };
    },
    statement: (p) =>
      `Un conductor de radio $a=${p.a}\\,\\mathrm{cm}$ está aislado con un blindaje de radio $b=${p.b}\\,\\mathrm{cm}$ puesto a tierra. Los aislantes tienen rigidez dieléctrica $E_{max}=${p.E}\\,\\mathrm{kV/cm}$ y se diseñan al máximo. Para (a) una sola capa de $\\varepsilon_r=6$ y (b) tres capas de $\\varepsilon_r=6,\\,4,\\,2$ (de adentro hacia afuera), determine la capacidad por unidad de longitud, la máxima tensión aplicable y grafique $E(r)$.`,
    strategy: {
      prompt: "En la versión de una sola capa, ¿dónde es máximo $E$?",
      options: [
        "En la superficie del conductor ($r=a$): $E\\propto1/r$",
        "En el blindaje ($r=b$)",
        "Es uniforme en todo el aislante",
        "En el punto medio entre $a$ y $b$",
      ],
      explain:
        "$E=V_0/\\left(r\\ln(b/a)\\right)$ decrece con $r$: el aislante falla primero junto al conductor. Con varias capas se baja la permitividad hacia afuera para que $E$ vuelva a valer $E_{max}$ al inicio de cada capa y se aproveche mejor el material.",
    },
    fields: (p) => {
      const a = (p.a ?? 1) / 100;
      const b = (p.b ?? 6) / 100;
      const e = (p.E ?? 100) * 1e5;
      const one = cableSingleLayer(a, b, e, 6);
      const multi = cableMultiLayer(a, b, e, [6, 4, 2]);
      return [
        { label: "Vmax (una capa)", unit: "kV", value: one.vmax / 1e3 },
        { label: "C/l (una capa)", unit: "pF/m", value: one.cPerM * 1e12 },
        { label: "Vmax (tres capas)", unit: "kV", value: multi.vmax / 1e3 },
        { label: "C/l (tres capas)", unit: "pF/m", value: multi.cPerM * 1e12 },
      ];
    },
    steps: (p) => {
      const a = (p.a ?? 1) / 100;
      const b = (p.b ?? 6) / 100;
      const e = (p.E ?? 100) * 1e5;
      const one = cableSingleLayer(a, b, e, 6);
      const multi = cableMultiLayer(a, b, e, [6, 4, 2]);
      return [
        {
          hint: "Laplace con simetría cilíndrica ($V(a)=V_0$, $V(b)=0$)",
          tex: T`\nabla^2V=\frac1r\frac{\partial}{\partial r}\left(r\frac{\partial V}{\partial r}\right)=0\;\Rightarrow\;V=\frac{V_0}{\ln(a/b)}\ln\frac rb,\qquad E=\frac{V_0}{r\ln(b/a)}`,
        },
        {
          hint: "Una capa: $E_{max}$ está en $r=a$",
          tex: T`V_{max}=E_{max}\,a\ln\frac ba=${n(one.vmax / 1e3)}\,\mathrm{kV}`,
        },
        {
          hint: "Capacidad por unidad de longitud ($\\varepsilon=6\\varepsilon_0$)",
          tex: T`\frac Cl=\frac{2\pi\varepsilon}{\ln(b/a)}=${n(one.cPerM * 1e12)}\,\mathrm{pF/m}`,
        },
        {
          hint: "Tres capas: $E=\\rho/(2\\pi\\varepsilon_{r}\\varepsilon_0 r)$ y $E=E_{max}$ al inicio de cada capa",
          tex: T`\frac{\rho}{2\pi\varepsilon_0}=6E_{max}a\;\Rightarrow\;r_1=\frac64\,a=${n(multi.r1 * 100)}\,\mathrm{cm},\quad r_2=\frac42\,r_1=${n(multi.r2 * 100)}\,\mathrm{cm}`,
        },
        {
          hint: "Tensión máxima: integrar $E$ capa por capa",
          tex: T`V_{max}=\frac{\rho}{2\pi\varepsilon_0}\left[\frac{\ln(r_1/a)}6+\frac{\ln(r_2/r_1)}4+\frac{\ln(b/r_2)}2\right]=${n(multi.vmax / 1e3)}\,\mathrm{kV}`,
          body: `La capacidad por unidad de longitud es $\\rho/V_{max}=${n(multi.cPerM * 1e12)}\\,\\mathrm{pF/m}$.`,
        },
      ];
    },
  },
];
