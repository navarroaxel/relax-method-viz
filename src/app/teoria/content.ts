/** Contenido de teoria.pdf (TdC 2P Teoría). Texto con `$...$` = matemática en línea. */

export interface Step {
  /** Pista visible antes de revelar: qué hay que recordar. */
  hint: string;
  body?: string;
  tex?: string;
}

export interface Card {
  id: string;
  title: string;
  question: string;
  steps: Step[];
}

export interface OrderItem {
  tex: string;
  why: string;
}

export interface OrderExercise {
  id: string;
  title: string;
  /** En el orden correcto. */
  items: OrderItem[];
}

export interface Pair {
  term: string; // LaTeX
  meaning: string;
}

export interface PairSet {
  id: string;
  title: string;
  pairs: Pair[];
}

const r = String.raw;

export const CARDS: Card[] = [
  {
    id: "poynting",
    title: "Teorema de Poynting",
    question:
      "Enuncie el teorema de Poynting. Describa conceptualmente cada término.",
    steps: [
      {
        hint: "Enunciado (balance de energía)",
        tex: r`P_J+\frac{\partial}{\partial t}\left(U_E+U_H\right)+\oint_{S=\partial V}\vec E\times\vec H\cdot d\vec s=0`,
        body: "Conservación local de la energía electromagnética.",
      },
      {
        hint: "$P_J$",
        tex: r`P_J=\int_V\vec E\cdot\vec J\,dV`,
        body: "Potencia de pérdidas por efecto Joule.",
      },
      {
        hint: "$U_E$",
        tex: r`U_E=\int_V\tfrac12\varepsilon E^2\,dV`,
        body: "Energía almacenada en el campo eléctrico.",
      },
      {
        hint: "$U_H$",
        tex: r`U_H=\int_V\tfrac12\mu H^2\,dV`,
        body: "Energía almacenada en el campo magnético.",
      },
      {
        hint: "Vector de Poynting",
        tex: r`\vec P=\vec E\times\vec H`,
        body: "Densidad superficial de potencia electromagnética.",
      },
      {
        hint: "Interpretación global",
        body: "La energía almacenada en V disminuye por dos motivos: se disipa por efecto Joule o sale a través de la superficie S. El flujo del vector de Poynting es la velocidad con que la energía se desplaza junto con la onda.",
      },
    ],
  },
  {
    id: "desplazamiento",
    title: "Corriente de desplazamiento",
    question:
      "Demuestre la necesidad de incluir la corriente de desplazamiento en la ley de Ampère para que los postulados sean consistentes con la conservación de la carga.",
    steps: [
      {
        hint: "Las cuatro ecuaciones con campos variables",
        tex: r`\nabla\times\vec E=-\frac{\partial\vec B}{\partial t},\quad \nabla\times\vec H=\vec J,\quad \nabla\cdot\vec D=\rho_v,\quad \nabla\cdot\vec B=0`,
        body: "La ley de Ampère figura todavía en su forma estática.",
      },
      {
        hint: "Principio que siempre debe cumplirse",
        tex: r`\nabla\cdot\vec J=-\frac{\partial\rho_v}{\partial t}`,
        body: "Ecuación de continuidad (conservación de la carga).",
      },
      {
        hint: "Dónde aparece la inconsistencia",
        tex: r`\nabla\cdot(\nabla\times\vec H)=0=\nabla\cdot\vec J`,
        body: "La divergencia de un rotor es nula, entonces Ampère estática obliga a $\\nabla\\cdot\\vec J=0$, pero con campos variables $\\nabla\\cdot\\vec J=-\\partial\\rho_v/\\partial t\\neq0$.",
      },
      {
        hint: "Corrección: usar continuidad + Gauss",
        tex: r`0=\nabla\cdot\vec J+\frac{\partial\rho_v}{\partial t}\;\Rightarrow\;\nabla\cdot(\nabla\times\vec H)=\nabla\cdot\left(\vec J+\frac{\partial\vec D}{\partial t}\right)`,
        body: "Se reemplaza $\\rho_v=\\nabla\\cdot\\vec D$.",
      },
      {
        hint: "Resultado: Ampère–Maxwell",
        tex: r`\nabla\times\vec H=\vec J+\frac{\partial\vec D}{\partial t}`,
        body: "El término adicional $\\partial\\vec D/\\partial t$ es necesario para que $\\nabla\\times\\vec H$ sea consistente con la conservación de la carga.",
      },
    ],
  },
  {
    id: "faraday",
    title: "Faraday y fem cinética",
    question:
      "Ley de Faraday de la inducción electromagnética: justifique la existencia de la fem cinética.",
    steps: [
      {
        hint: "Definición de fem",
        tex: r`fem_i=\oint_C\frac{\vec F}{q}\cdot d\vec l`,
        body: "Energía (trabajo) entregado a una carga $q$ al recorrer un camino cerrado $C=\\partial S$.",
      },
      {
        hint: "Fuerza que actúa",
        tex: r`\vec F=q\left(\vec E+\vec v\times\vec B\right)`,
        body: "Fuerza de Lorentz.",
      },
      {
        hint: "Aplicar el teorema del rotor (Stokes)",
        tex: r`fem_i=\oint_C(\vec E+\vec v\times\vec B)\cdot d\vec l=\int_S\nabla\times\vec E\cdot d\vec s+\oint_{\partial S}\vec v\times\vec B\cdot d\vec l`,
      },
      {
        hint: "Reemplazar el rotor de E (Faraday)",
        tex: r`fem_i=-\int_S\frac{\partial\vec B}{\partial t}\cdot d\vec s+\oint_{\partial S}\vec v\times\vec B\cdot d\vec l`,
      },
      {
        hint: "Identificar la fem cinética",
        tex: r`fem_R=\oint_{\partial S}\vec v\times\vec B\cdot d\vec l`,
        body: "Fem cinética o de rotación. Proviene del término magnético de la fuerza de Lorentz. Existe siempre que el circuito se mueva ($\\vec v\\neq0$) dentro de un campo $\\vec B$, aunque $B$ sea constante en el tiempo.",
      },
    ],
  },
  {
    id: "onda-conductor",
    title: "Onda plana en conductor vs dieléctrico",
    question:
      "Describir cómo son los vectores de campo eléctrico y magnético de una onda plana que se propaga en un material conductor. ¿Cuál es la fundamentación física de la diferencia con un dieléctrico?",
    steps: [
      {
        hint: "Ecuaciones de partida (medio material) y ecuación de onda",
        tex: r`\nabla\times\vec H=\sigma\vec E+\varepsilon\frac{\partial\vec E}{\partial t},\;\; \nabla\times\vec E=-\mu\frac{\partial\vec H}{\partial t}\;\Rightarrow\;\nabla^2\vec E_0=\Gamma^2\vec E_0,\;\; \Gamma^2=j\omega\mu\sigma-\omega^2\mu\varepsilon`,
      },
      {
        hint: "Constante de propagación",
        tex: r`\Gamma=\alpha+j\beta`,
        body: "$\\alpha$: constante de atenuación. $\\beta$: constante de fase.",
      },
      {
        hint: "Forma de los campos (onda hacia +x)",
        tex: r`\vec E=E_Me^{-\alpha x}e^{j(\omega t-\beta x)}\hat a_y,\qquad \vec H=H_Me^{-\alpha x}e^{j(\omega t-\beta x+\gamma)}\hat a_z`,
      },
      {
        hint: "Cómo son E y H entre sí",
        body: "Presentan un desfase temporal $\\gamma$ y cuadratura espacial (son ortogonales), y se atenúan exponencialmente en la dirección de movimiento según $\\alpha$.",
      },
      {
        hint: "Conductor ideal ($\\sigma\\to\\infty$)",
        tex: r`\Gamma^2\to j\omega\mu\sigma\;\Rightarrow\;\Gamma=\sqrt{\omega\mu\sigma}\,e^{j\pi/4}\;\Rightarrow\;\alpha=\beta=\sqrt{\frac{\omega\mu\sigma}{2}}`,
      },
      {
        hint: "Dieléctrico ideal ($\\sigma=0$)",
        tex: r`\Gamma^2=-\omega^2\mu\varepsilon\;\Rightarrow\;\Gamma=j\omega\sqrt{\mu\varepsilon}\;\Rightarrow\;\alpha=0,\;\beta=\omega\sqrt{\mu\varepsilon}`,
        body: "No hay atenuación ($\\alpha=0$), los campos están en fase ($\\gamma=0$) y la onda se propaga sin perder amplitud.",
      },
    ],
  },
  {
    id: "paralelos",
    title: "Conductores paralelos",
    question:
      "Demuestre que dos conductores paralelos, rectos e infinitamente largos se repelen al circular por ellos corrientes en la misma dirección y sentido opuesto.",
    steps: [
      {
        hint: "Fuerza magnética sobre una carga / un circuito",
        tex: r`\vec F_m=q\vec v\times\vec B\;\Rightarrow\;\vec F_m=I\oint_C d\vec l\times\vec B`,
        body: "Lorentz.",
      },
      {
        hint: "Fuerza de $C_1$ sobre $C_2$",
        tex: r`\vec F_{12}=I_2\oint_{C_2}d\vec l_2\times\vec B_{12}`,
      },
      {
        hint: "Campo $\\vec B_{12}$ creado por $I_1$",
        tex: r`\vec B_{12}=\frac{\mu_0I_1}{4\pi}\oint_{C_1}\frac{d\vec l_1\times\hat a_{R12}}{R_{12}^2}`,
        body: "Ley de Biot–Savart.",
      },
      {
        hint: "Reemplazando: doble integral",
        tex: r`\vec F_{12}=\frac{\mu_0}{4\pi}I_1I_2\oint_{C_2}\oint_{C_1}\frac{d\vec l_2\times(d\vec l_1\times\hat a_{R12})}{R_{12}^2}`,
      },
      {
        hint: "Conclusión",
        tex: r`d\vec l_1=dz\,\hat a_z,\quad d\vec l_2=-dz\,\hat a_z`,
        body: "Calculando $\\vec F_{12}$ y $\\vec F_{21}$ con estas direcciones, las fuerzas se alejan: los conductores se repelen.",
      },
    ],
  },
  {
    id: "permeabilidad",
    title: "Medición de μ₀",
    question:
      "Describir el arreglo experimental para determinar la permeabilidad en el vacío y obtener la expresión de cálculo del valor representativo.",
    steps: [
      {
        hint: "Arreglo experimental",
        body: "Una espira semi-rectangular y un conductor; por ambos circula la misma corriente $I$. La espira está sostenida por un sensor de fuerza, que detecta la fuerza que el conductor ejerce sobre ella para luego obtener $\\mu_0$.",
      },
      {
        hint: "Campo del conductor (Ampère)",
        tex: r`\oint_C\vec B\cdot d\vec l=\mu_0I\;\Rightarrow\;\vec B=\frac{\mu_0I}{2\pi r}\hat a_z`,
        body: "En el lado inferior $r=d$ y en el superior $r=d+h$.",
      },
      {
        hint: "Fuerza sobre el lado inferior (longitud $L$)",
        tex: r`\vec F_{m,inf}=\frac{\mu_0I^2L}{2\pi d}(-\hat a_y)`,
      },
      {
        hint: "Fuerza sobre el lado superior (longitud $L-a$)",
        tex: r`\vec F_{m,sup}=\frac{\mu_0I^2(L-a)}{2\pi(d+h)}\hat a_y`,
      },
      {
        hint: "Fuerza total",
        tex: r`\vec F_m=\frac{\mu_0I^2}{2\pi}\left(\frac{L-a}{d+h}-\frac{L}{d}\right)\hat a_y`,
      },
      {
        hint: "Despejar μ₀",
        tex: r`\mu_0=\frac{2\pi\,|\vec F_m|}{I^2\left(\frac{L-a}{d+h}-\frac{L}{d}\right)}`,
      },
    ],
  },
  {
    id: "postulados",
    title: "Postulados del electromagnetismo",
    question:
      "Escriba los postulados y las ecuaciones que modelan el electromagnetismo clásico y explique brevemente su significado.",
    steps: [
      {
        hint: "Conservación de la carga",
        tex: r`\nabla\cdot\vec J=-\frac{\partial\rho_v}{\partial t}`,
      },
      {
        hint: "Fuerza de Lorentz",
        tex: r`\vec F=q\left(\vec E+\vec v\times\vec B\right)`,
      },
      {
        hint: "Teorema de Helmholtz",
        body: "Un campo vectorial queda determinado si se especifican su divergencia y su rotor en todos los puntos.",
      },
      {
        hint: "Relaciones constitutivas",
        tex: r`\vec D=\varepsilon\vec E,\qquad \vec B=\mu\vec H,\qquad \vec J=\sigma\vec E`,
      },
      {
        hint: "Ley de Faraday",
        tex: r`\nabla\times\vec E=-\frac{\partial\vec B}{\partial t}`,
        body: "Un campo magnético variable en el tiempo genera un campo eléctrico con rotor no nulo.",
      },
      {
        hint: "Ley de Ampère–Maxwell",
        tex: r`\nabla\times\vec H=\vec J+\frac{\partial\vec D}{\partial t}`,
        body: "Las corrientes, reales o de desplazamiento, generan campos magnéticos.",
      },
      {
        hint: "Ley de Gauss",
        tex: r`\nabla\cdot\vec D=\rho_v`,
        body: "Las cargas son las fuentes escalares del campo eléctrico.",
      },
      {
        hint: "No existen monopolos magnéticos",
        tex: r`\nabla\cdot\vec B=0`,
        body: "El campo magnético es solenoidal: las líneas de $\\vec B$ son cerradas porque no hay cargas magnéticas aisladas.",
      },
    ],
  },
  {
    id: "velocidad-luz",
    title: "Ondas en el vacío a velocidad c",
    question:
      "Demuestre que las ondas electromagnéticas que se propagan en el vacío lo hacen a la velocidad de la luz.",
    steps: [
      {
        hint: "Maxwell en el vacío ($\\rho_v=0$, $\\vec J=0$)",
        tex: r`\nabla\times\vec E=-\mu_0\frac{\partial\vec H}{\partial t},\;\; \nabla\cdot\vec E=0,\;\; \nabla\times\vec H=\varepsilon_0\frac{\partial\vec E}{\partial t},\;\; \nabla\cdot\vec H=0`,
      },
      {
        hint: "Rotor de Faraday + identidad vectorial",
        tex: r`\nabla\times\nabla\times\vec E=\nabla(\nabla\cdot\vec E)-\nabla^2\vec E`,
        body: "Como $\\nabla\\cdot\\vec E=0$ queda $-\\nabla^2\\vec E=-\\mu_0\\frac{\\partial}{\\partial t}(\\nabla\\times\\vec H)$.",
      },
      {
        hint: "Ecuación de onda",
        tex: r`\nabla^2\vec E=\mu_0\varepsilon_0\frac{\partial^2\vec E}{\partial t^2}`,
        body: "Lo mismo vale para $\\vec H$ con el procedimiento análogo.",
      },
      {
        hint: "Forma de la solución",
        tex: r`\vec E(x,t)=\vec f(x\pm vt)\;\Rightarrow\;\vec f''=\mu_0\varepsilon_0v^2\vec f''`,
      },
      {
        hint: "Condición para ser solución",
        tex: r`\mu_0\varepsilon_0v^2=1\;\Rightarrow\;v=\frac{1}{\sqrt{\mu_0\varepsilon_0}}\approx3\cdot10^8\,\tfrac{m}{s}=c`,
        body: "La velocidad de propagación en el espacio libre respecto a cualquier observador coincide con la velocidad de la luz.",
      },
    ],
  },
  {
    id: "continuidad",
    title: "Ecuación de continuidad",
    question:
      "Ecuación de continuidad para las corrientes eléctricas, deducción de la misma.",
    steps: [
      {
        hint: "Carga total en un volumen fijo V",
        tex: r`Q=\int_V\rho_v\,dV`,
      },
      {
        hint: "Corriente que sale de V por S",
        tex: r`I=\oint_S\vec J\cdot d\vec s=-\frac{d}{dt}\int_V\rho_v\,dV=-\int_V\frac{\partial\rho_v}{\partial t}dV`,
      },
      {
        hint: "Teorema de la divergencia",
        tex: r`\oint_S\vec J\cdot d\vec s=\int_V\nabla\cdot\vec J\,dV`,
      },
      {
        hint: "Igualar: integrando nulo (V es fijo y arbitrario)",
        tex: r`\int_V\left(\nabla\cdot\vec J+\frac{\partial\rho_v}{\partial t}\right)dV=0`,
      },
      {
        hint: "Resultado",
        tex: r`\nabla\cdot\vec J+\frac{\partial\rho_v}{\partial t}=0`,
      },
    ],
  },
  {
    id: "atenuacion",
    title: "Atenuación: dieléctrico vs material",
    question:
      "Justifique por qué las ondas EM no se atenúan en dieléctricos y sí en medios materiales.",
    steps: [
      {
        hint: "Campo y constante de propagación",
        tex: r`\vec E=E_Me^{-\alpha x}e^{j(\omega t-\beta x)}\hat a_y,\qquad \Gamma=\alpha+j\beta,\quad \Gamma^2=j\omega\mu\sigma-\omega^2\mu\varepsilon`,
        body: "La parte real $\\alpha$ es la constante de atenuación: la amplitud queda $E_Me^{-\\alpha x}$.",
      },
      {
        hint: "Dieléctrico ideal ($\\sigma=0$)",
        tex: r`\Gamma^2=-\omega^2\mu\varepsilon\;\Rightarrow\;\alpha=0\;\wedge\;\beta=\omega\sqrt{\mu\varepsilon}`,
      },
      {
        hint: "Causa física",
        body: "La atenuación se debe a pérdidas por efecto Joule por las corrientes inducidas en el material ($\\vec J=\\sigma\\vec E$). Si $\\sigma=0$ no hay corrientes de inducción. Con $\\sigma\\neq0$ esa energía sale de la onda y su intensidad disminuye.",
      },
    ],
  },
  {
    id: "factor-medio",
    title: "Factor que determina el comportamiento del medio",
    question:
      "¿Cuál es el factor que determina el comportamiento de un medio ante la propagación de una onda electromagnética?",
    steps: [
      {
        hint: "El factor",
        tex: r`\frac{\sigma}{\omega\varepsilon}`,
        body: "Compara la corriente de conducción $\\sigma E$ con la de desplazamiento $\\omega\\varepsilon E$.",
      },
      {
        hint: "Si es mucho menor que 1",
        tex: r`\frac{\sigma}{\omega\varepsilon}\ll1\;\Rightarrow\;\beta\approx\omega\sqrt{\mu\varepsilon}`,
        body: "Buen dieléctrico: poca atenuación.",
      },
      {
        hint: "Si es mucho mayor que 1",
        tex: r`\frac{\sigma}{\omega\varepsilon}\gg1\;\Rightarrow\;\alpha\approx\beta\approx\sqrt{\frac{\omega\mu\sigma}{2}}`,
        body: "Buen conductor: mucha atenuación.",
      },
      {
        hint: "Consecuencia",
        body: "El mismo material puede comportarse distinto según la frecuencia de la onda.",
      },
    ],
  },
  {
    id: "corriente-lineal",
    title: "Corriente lineal e inductancia",
    question:
      "¿Qué es una corriente lineal? ¿Qué parámetro se define cómodamente a partir de ella? ¿Utilidad para calcular campos?",
    steps: [
      {
        hint: "Definición",
        body: "Corriente $I$ que circula por una línea $L$ de sección transversal despreciable. Es una idealización.",
      },
      {
        hint: "Utilidad: potencial vectorial",
        tex: r`\vec A=\frac{\mu_0I}{4\pi}\int_L\frac{d\vec l}{R},\qquad \vec B=\nabla\times\vec A`,
        body: "Se reemplaza $\\vec J\\,dV$ por $I\\,d\\vec l$: se evita integrar sobre el volumen del conductor, queda una sola integral sobre la línea.",
      },
      {
        hint: "Flujo (Stokes)",
        tex: r`\Phi_M=\oint_C\vec A\cdot d\vec l`,
      },
      {
        hint: "Parámetro: inductancia magnética",
        tex: r`L=\frac{\Phi_M}{I}`,
        body: "En un medio lineal $\\vec A\\propto I$, así que $L$ depende solo de la forma del circuito y de $\\mu_0$: es propiedad del circuito, no de la corriente. Es el flujo creado por cada ampere.",
      },
      {
        hint: "Energía magnética almacenada",
        tex: r`W_M=\tfrac12LI^2`,
      },
    ],
  },
];

export const ORDER_EXERCISES: OrderExercise[] = [
  {
    id: "o-desplazamiento",
    title: "Corriente de desplazamiento",
    items: [
      {
        tex: r`\nabla\cdot(\nabla\times\vec H)=0=\nabla\cdot\vec J`,
        why: "Divergencia de un rotor = 0; con Ampère estática implica ∇·J = 0.",
      },
      {
        tex: r`\nabla\cdot\vec J=-\frac{\partial\rho_v}{\partial t}`,
        why: "Pero la conservación de la carga exige esto: contradicción en régimen variable.",
      },
      {
        tex: r`\nabla\cdot(\nabla\times\vec H)=0=\nabla\cdot\vec J+\frac{\partial\rho_v}{\partial t}`,
        why: "Se incorpora la continuidad en el lado derecho.",
      },
      {
        tex: r`\nabla\cdot(\nabla\times\vec H)=\nabla\cdot\left(\vec J+\frac{\partial\vec D}{\partial t}\right)`,
        why: "Con Gauss, ρ_v = ∇·D.",
      },
      {
        tex: r`\nabla\times\vec H=\vec J+\frac{\partial\vec D}{\partial t}`,
        why: "Ampère–Maxwell.",
      },
    ],
  },
  {
    id: "o-continuidad",
    title: "Ecuación de continuidad",
    items: [
      { tex: r`Q=\int_V\rho_v\,dV`, why: "Carga en un volumen fijo." },
      {
        tex: r`\oint_S\vec J\cdot d\vec s=-\frac{d}{dt}\int_V\rho_v\,dV`,
        why: "La corriente que sale es la carga que disminuye.",
      },
      {
        tex: r`\oint_S\vec J\cdot d\vec s=\int_V\nabla\cdot\vec J\,dV`,
        why: "Teorema de la divergencia.",
      },
      {
        tex: r`\int_V\left(\nabla\cdot\vec J+\frac{\partial\rho_v}{\partial t}\right)dV=0`,
        why: "Se igualan ambas expresiones.",
      },
      {
        tex: r`\nabla\cdot\vec J+\frac{\partial\rho_v}{\partial t}=0`,
        why: "V fijo y arbitrario: el integrando es nulo.",
      },
    ],
  },
  {
    id: "o-luz",
    title: "Velocidad de la luz",
    items: [
      {
        tex: r`\nabla\times\vec E=-\mu_0\frac{\partial\vec H}{\partial t},\;\; \nabla\times\vec H=\varepsilon_0\frac{\partial\vec E}{\partial t}`,
        why: "Maxwell en el vacío.",
      },
      {
        tex: r`\nabla\times\nabla\times\vec E=\nabla(\nabla\cdot\vec E)-\nabla^2\vec E`,
        why: "Rotor de Faraday + identidad vectorial (∇·E = 0).",
      },
      {
        tex: r`\nabla^2\vec E=\mu_0\varepsilon_0\frac{\partial^2\vec E}{\partial t^2}`,
        why: "Ecuación de onda.",
      },
      {
        tex: r`\vec E=\vec f(x\pm vt)\;\Rightarrow\;\vec f''=\mu_0\varepsilon_0v^2\vec f''`,
        why: "Se prueba una solución de la forma f(x ± vt).",
      },
      {
        tex: r`v=\frac{1}{\sqrt{\mu_0\varepsilon_0}}=c`,
        why: "Condición μ₀ε₀v² = 1.",
      },
    ],
  },
  {
    id: "o-fem",
    title: "Fem cinética",
    items: [
      {
        tex: r`fem_i=\oint_C\frac{\vec F}{q}\cdot d\vec l`,
        why: "Definición.",
      },
      {
        tex: r`\vec F=q(\vec E+\vec v\times\vec B)`,
        why: "Fuerza de Lorentz.",
      },
      {
        tex: r`fem_i=\int_S\nabla\times\vec E\cdot d\vec s+\oint_{\partial S}\vec v\times\vec B\cdot d\vec l`,
        why: "Teorema del rotor.",
      },
      {
        tex: r`fem_i=-\int_S\frac{\partial\vec B}{\partial t}\cdot d\vec s+\oint_{\partial S}\vec v\times\vec B\cdot d\vec l`,
        why: "Faraday: ∇×E = −∂B/∂t.",
      },
      {
        tex: r`fem_R=\oint_{\partial S}\vec v\times\vec B\cdot d\vec l`,
        why: "Segundo término: fem cinética (v ≠ 0 en un campo B).",
      },
    ],
  },
  {
    id: "o-paralelos",
    title: "Fuerza entre conductores",
    items: [
      {
        tex: r`\vec F_m=I\oint_C d\vec l\times\vec B`,
        why: "Lorentz para un circuito.",
      },
      {
        tex: r`\vec F_{12}=I_2\oint_{C_2}d\vec l_2\times\vec B_{12}`,
        why: "Fuerza de C₁ sobre C₂.",
      },
      {
        tex: r`\vec B_{12}=\frac{\mu_0I_1}{4\pi}\oint_{C_1}\frac{d\vec l_1\times\hat a_{R12}}{R_{12}^2}`,
        why: "Biot–Savart.",
      },
      {
        tex: r`\vec F_{12}=\frac{\mu_0}{4\pi}I_1I_2\oint_{C_2}\oint_{C_1}\frac{d\vec l_2\times(d\vec l_1\times\hat a_{R12})}{R_{12}^2}`,
        why: "Reemplazo.",
      },
      {
        tex: r`d\vec l_1=dz\,\hat a_z,\;\; d\vec l_2=-dz\,\hat a_z`,
        why: "Corrientes antiparalelas: F₁₂ y F₂₁ se alejan → se repelen.",
      },
    ],
  },
  {
    id: "o-mu0",
    title: "Cálculo de μ₀",
    items: [
      {
        tex: r`\vec B=\frac{\mu_0I}{2\pi r}\hat a_z`,
        why: "Campo del conductor (Ampère).",
      },
      {
        tex: r`\vec F_{m,inf}=\frac{\mu_0I^2L}{2\pi d}(-\hat a_y)`,
        why: "Lado inferior de la espira.",
      },
      {
        tex: r`\vec F_{m,sup}=\frac{\mu_0I^2(L-a)}{2\pi(d+h)}\hat a_y`,
        why: "Lado superior de la espira.",
      },
      {
        tex: r`\vec F_m=\frac{\mu_0I^2}{2\pi}\left(\frac{L-a}{d+h}-\frac{L}{d}\right)\hat a_y`,
        why: "Suma de ambas.",
      },
      {
        tex: r`\mu_0=\frac{2\pi|\vec F_m|}{I^2\left(\frac{L-a}{d+h}-\frac{L}{d}\right)}`,
        why: "Se despeja μ₀.",
      },
    ],
  },
];

export const PAIR_SETS: PairSet[] = [
  {
    id: "p-postulados",
    title: "Postulados y Maxwell",
    pairs: [
      {
        term: r`\nabla\times\vec E=-\frac{\partial\vec B}{\partial t}`,
        meaning: "Faraday: un B variable genera un E con rotor no nulo",
      },
      {
        term: r`\nabla\times\vec H=\vec J+\frac{\partial\vec D}{\partial t}`,
        meaning:
          "Ampère–Maxwell: corrientes reales o de desplazamiento generan B",
      },
      {
        term: r`\nabla\cdot\vec D=\rho_v`,
        meaning: "Gauss: las cargas son las fuentes escalares de E",
      },
      {
        term: r`\nabla\cdot\vec B=0`,
        meaning: "No hay monopolos: B solenoidal, líneas cerradas",
      },
      {
        term: r`\nabla\cdot\vec J=-\frac{\partial\rho_v}{\partial t}`,
        meaning: "Conservación de la carga (continuidad)",
      },
      {
        term: r`\vec F=q(\vec E+\vec v\times\vec B)`,
        meaning: "Fuerza de Lorentz sobre una carga en movimiento",
      },
      {
        term: r`\vec D=\varepsilon\vec E,\;\vec B=\mu\vec H,\;\vec J=\sigma\vec E`,
        meaning: "Relaciones constitutivas del medio",
      },
    ],
  },
  {
    id: "p-poynting",
    title: "Poynting y energía",
    pairs: [
      {
        term: r`P_J=\int_V\vec E\cdot\vec J\,dV`,
        meaning: "Potencia de pérdidas por efecto Joule",
      },
      {
        term: r`U_E=\int_V\tfrac12\varepsilon E^2dV`,
        meaning: "Energía almacenada en el campo eléctrico",
      },
      {
        term: r`U_H=\int_V\tfrac12\mu H^2dV`,
        meaning: "Energía almacenada en el campo magnético",
      },
      {
        term: r`\vec P=\vec E\times\vec H`,
        meaning: "Vector de Poynting: densidad superficial de potencia",
      },
      {
        term: r`\oint_S\vec E\times\vec H\cdot d\vec s`,
        meaning: "Potencia que sale de V a través de S",
      },
      {
        term: r`W_M=\tfrac12LI^2`,
        meaning: "Energía magnética almacenada en un circuito",
      },
    ],
  },
  {
    id: "p-medios",
    title: "Ondas en medios",
    pairs: [
      {
        term: r`\Gamma=\alpha+j\beta`,
        meaning: "Constante de propagación (α atenúa, β fase)",
      },
      {
        term: r`\sigma=0\Rightarrow\alpha=0,\;\beta=\omega\sqrt{\mu\varepsilon}`,
        meaning: "Dieléctrico ideal: sin atenuación, E y H en fase",
      },
      {
        term: r`\alpha=\beta=\sqrt{\frac{\omega\mu\sigma}{2}}`,
        meaning: "Conductor ideal (σ → ∞)",
      },
      {
        term: r`\frac{\sigma}{\omega\varepsilon}\ll1`,
        meaning: "Buen dieléctrico: predomina la corriente de desplazamiento",
      },
      {
        term: r`\frac{\sigma}{\omega\varepsilon}\gg1`,
        meaning: "Buen conductor: predomina la corriente de conducción",
      },
      {
        term: r`v=\frac{1}{\sqrt{\mu_0\varepsilon_0}}`,
        meaning: "Velocidad de las ondas en el vacío: c",
      },
      {
        term: r`fem_R=\oint\vec v\times\vec B\cdot d\vec l`,
        meaning: "Fem cinética o de rotación (circuito en movimiento)",
      },
    ],
  },
];
