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
        body: "Fem cinética o de rotación. Proviene del término magnético de la fuerza de Lorentz. Aparece cuando el circuito se mueve y $\\vec v\\times\\vec B$ tiene componente a lo largo del circuito, de modo que la integral no se anula; puede darse aunque $B$ sea constante en el tiempo.",
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
        tex: r`\mu_0=\frac{2\pi\,|\vec F_m|}{I^2\left(\frac Ld-\frac{L-a}{d+h}\right)}`,
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
        tex: r`\mu_0=\frac{2\pi|\vec F_m|}{I^2\left(\frac Ld-\frac{L-a}{d+h}\right)}`,
        why: "Se despeja μ₀.",
      },
    ],
  },
  {
    id: "o-energia-campo",
    title: "Energía magnética en función de los campos (guía 35)",
    items: [
      {
        tex: r`W_m=\tfrac12LI^2=\tfrac12I\Phi`,
        why: "Energía magnética de un circuito.",
      },
      {
        tex: r`W_m=\tfrac12\int_V\vec J\cdot\vec A\,dV`,
        why: r`Con el potencial vectorial, $\vec B=\nabla\times\vec A$.`,
      },
      {
        tex: r`W_m=\tfrac12\int_V(\nabla\times\vec H)\cdot\vec A\,dV`,
        why: r`Ampère en régimen estacionario: $\vec J=\nabla\times\vec H$.`,
      },
      {
        tex: r`W_m=\tfrac12\int_V\vec H\cdot(\nabla\times\vec A)\,dV-\tfrac12\int_V\nabla\cdot(\vec A\times\vec H)\,dV`,
        why: r`Identidad $\nabla\cdot(\vec A\times\vec H)=\vec H\cdot\nabla\times\vec A-\vec A\cdot\nabla\times\vec H$; el último término es una integral de superficie que se anula en el infinito.`,
      },
      {
        tex: r`W_m=\tfrac12\int_V\vec B\cdot\vec H\,dV`,
        why: "Resultado: la energía está distribuida en el campo.",
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

export interface QuizOption {
  tex?: string;
  text?: string;
}

export interface QuizQuestion {
  id: string;
  /** Tarjeta que baja de nivel si se falla. */
  cardId: string;
  prompt: string;
  /** La opción correcta siempre va primero acá; la UI las mezcla. */
  options: QuizOption[];
  explain: string;
}

const t = (tex: string): QuizOption => ({ tex });
const x = (text: string): QuizOption => ({ text });

export const QUIZ: QuizQuestion[] = [
  {
    id: "q-poynting-flujo",
    cardId: "poynting",
    prompt:
      "¿Qué representa el flujo del vector de Poynting a través de $S=\\partial V$?",
    options: [
      x("La potencia electromagnética que sale del volumen V"),
      x("La energía almacenada en el campo eléctrico dentro de V"),
      x("La potencia disipada por efecto Joule dentro de V"),
      x("La carga que atraviesa la superficie S por unidad de tiempo"),
    ],
    explain:
      "La energía en V baja por Joule o porque sale por S; el flujo de $\\vec E\\times\\vec H$ es esto último.",
  },
  {
    id: "q-poynting-uh",
    cardId: "poynting",
    prompt: "La energía almacenada en el campo magnético es:",
    options: [
      t(r`U_H=\int_V\tfrac12\mu H^2\,dV`),
      t(r`U_H=\int_V\tfrac12\varepsilon H^2\,dV`),
      t(r`U_H=\int_V\mu H\,dV`),
      t(r`U_H=\int_V\tfrac12\mu^2 H\,dV`),
    ],
    explain: "$\\varepsilon$ va con $E$ (campo eléctrico); $\\mu$ va con $H$.",
  },
  {
    id: "q-poynting-balance",
    cardId: "poynting",
    prompt: "¿Cuál es el teorema de Poynting?",
    options: [
      t(
        r`P_J+\frac{\partial}{\partial t}(U_E+U_H)+\oint_S\vec E\times\vec H\cdot d\vec s=0`,
      ),
      t(
        r`P_J-\frac{\partial}{\partial t}(U_E+U_H)+\oint_S\vec E\times\vec H\cdot d\vec s=0`,
      ),
      t(
        r`P_J+\frac{\partial}{\partial t}(U_E-U_H)+\oint_S\vec E\times\vec H\cdot d\vec s=0`,
      ),
      t(
        r`P_J+\frac{\partial}{\partial t}(U_E+U_H)+\oint_S\vec E\cdot\vec H\,ds=0`,
      ),
    ],
    explain:
      "Los tres términos suman cero; las energías se suman y el flujo es del producto vectorial $\\vec E\\times\\vec H$.",
  },
  {
    id: "q-desp-incons",
    cardId: "desplazamiento",
    prompt:
      "¿Por qué la ley de Ampère estática ($\\nabla\\times\\vec H=\\vec J$) es inconsistente con campos variables?",
    options: [
      x(
        "Porque la divergencia de un rotor es 0, lo que fuerza $\\nabla\\cdot\\vec J=0$, y eso contradice la ecuación de continuidad",
      ),
      x("Porque no cumple la ley de Gauss para el campo magnético"),
      x("Porque $\\nabla\\times\\vec E$ deja de ser nulo"),
      x("Porque $\\vec H$ deja de ser solenoidal"),
    ],
    explain:
      "$\\nabla\\cdot(\\nabla\\times\\vec H)=0$ siempre, pero la continuidad pide $\\nabla\\cdot\\vec J=-\\partial\\rho_v/\\partial t\\neq0$.",
  },
  {
    id: "q-desp-ampere",
    cardId: "desplazamiento",
    prompt: "La ley de Ampère–Maxwell es:",
    options: [
      t(r`\nabla\times\vec H=\vec J+\frac{\partial\vec D}{\partial t}`),
      t(r`\nabla\times\vec H=\vec J-\frac{\partial\vec D}{\partial t}`),
      t(r`\nabla\times\vec H=\vec J+\frac{\partial\vec B}{\partial t}`),
      t(r`\nabla\times\vec E=\vec J+\frac{\partial\vec D}{\partial t}`),
    ],
    explain:
      "Sale de combinar continuidad con $\\rho_v=\\nabla\\cdot\\vec D$: el término es $+\\partial\\vec D/\\partial t$.",
  },
  {
    id: "q-faraday-cond",
    cardId: "faraday",
    prompt: "¿Cuándo existe fem cinética?",
    options: [
      x(
        "Cuando el circuito se mueve en un campo $\\vec B$ y $\\oint(\\vec v\\times\\vec B)\\cdot d\\vec l\\neq0$, aunque $B$ sea constante en el tiempo",
      ),
      x("Solo cuando $\\vec B$ varía en el tiempo"),
      x("Solo cuando el circuito está en reposo"),
      x("Solo cuando hay un campo eléctrico estático"),
    ],
    explain:
      "La fem cinética sale del término magnético de la fuerza de Lorentz; la variación temporal de $B$ da el otro término (transformador).",
  },
  {
    id: "q-faraday-expr",
    cardId: "faraday",
    prompt: "La fem cinética o de rotación es:",
    options: [
      t(r`fem_R=\oint_{\partial S}\vec v\times\vec B\cdot d\vec l`),
      t(r`fem_R=\oint_{\partial S}\vec v\cdot\vec B\,dl`),
      t(r`fem_R=-\int_S\frac{\partial\vec B}{\partial t}\cdot d\vec s`),
      t(r`fem_R=\oint_{\partial S}\vec E\times\vec v\cdot d\vec l`),
    ],
    explain:
      "La opción de $-\\int\\partial B/\\partial t$ es la fem de transformador, no la cinética.",
  },
  {
    id: "q-faraday-ley",
    cardId: "postulados",
    prompt: "¿Cuál es la ley de Faraday en forma diferencial?",
    options: [
      t(r`\nabla\times\vec E=-\frac{\partial\vec B}{\partial t}`),
      t(r`\nabla\times\vec E=\frac{\partial\vec B}{\partial t}`),
      t(r`\nabla\times\vec B=-\frac{\partial\vec E}{\partial t}`),
      t(r`\nabla\cdot\vec E=-\frac{\partial\vec B}{\partial t}`),
    ],
    explain: "Rotor de $E$ (no divergencia) y signo negativo (Lenz).",
  },
  {
    id: "q-conductor-ideal",
    cardId: "onda-conductor",
    prompt:
      "En un conductor ideal ($\\sigma\\to\\infty$) las constantes de propagación son:",
    options: [
      t(r`\alpha=\beta=\sqrt{\frac{\omega\mu\sigma}{2}}`),
      t(r`\alpha=0,\;\beta=\omega\sqrt{\mu\varepsilon}`),
      t(r`\alpha=\beta=\omega\mu\sigma`),
      t(r`\alpha=\sqrt{\frac{\omega\mu\sigma}{2}},\;\beta=0`),
    ],
    explain:
      "$\\Gamma^2\\to j\\omega\\mu\\sigma$, de donde $\\Gamma=\\sqrt{\\omega\\mu\\sigma}e^{j\\pi/4}$ y $\\alpha=\\beta$. La segunda opción es el dieléctrico ideal.",
  },
  {
    id: "q-dielectrico-fase",
    cardId: "onda-conductor",
    prompt:
      "En un dieléctrico ideal, los campos $\\vec E$ y $\\vec H$ de la onda plana:",
    options: [
      x(
        "Están en fase ($\\gamma=0$), son ortogonales y la amplitud se mantiene",
      ),
      x("Están en fase, pero la amplitud decrece como $e^{-\\alpha x}$"),
      x("Tienen un desfase temporal de $\\pi/4$"),
      x("Son paralelos entre sí y en fase"),
    ],
    explain:
      "$\\alpha=0$ implica sin atenuación. El desfase de $\\pi/4$ corresponde al conductor ideal.",
  },
  {
    id: "q-atenuacion-causa",
    cardId: "atenuacion",
    prompt: "¿Cuál es la causa física de la atenuación en un medio material?",
    options: [
      x(
        "Pérdidas por efecto Joule de las corrientes inducidas $\\vec J=\\sigma\\vec E$",
      ),
      x("La corriente de desplazamiento $\\partial\\vec D/\\partial t$"),
      x("La reducción de la frecuencia de la onda"),
      x("La divergencia de $\\vec B$ no nula"),
    ],
    explain: "Con $\\sigma=0$ no hay corrientes inducidas y $\\alpha=0$.",
  },
  {
    id: "q-factor-conductor",
    cardId: "factor-medio",
    prompt: "Si $\\sigma/\\omega\\varepsilon\\gg1$, el medio se comporta como:",
    options: [
      x(
        "Buen conductor, con $\\alpha\\approx\\beta\\approx\\sqrt{\\omega\\mu\\sigma/2}$",
      ),
      x(
        "Buen dieléctrico, con $\\beta\\approx\\omega\\sqrt{\\mu\\varepsilon}$",
      ),
      x("Vacío, con $v=c$"),
      x("Conductor ideal, sin campo en su interior y $\\alpha=0$"),
    ],
    explain:
      "Predomina la corriente de conducción $\\sigma E$ sobre la de desplazamiento $\\omega\\varepsilon E$.",
  },
  {
    id: "q-factor-frecuencia",
    cardId: "factor-medio",
    prompt:
      "Si aumentás mucho la frecuencia en un material con $\\sigma$ y $\\varepsilon$ fijos, ¿cómo cambia su comportamiento?",
    options: [
      x(
        "Tiende a comportarse como dieléctrico, porque $\\sigma/\\omega\\varepsilon$ disminuye",
      ),
      x(
        "Tiende a comportarse como conductor, porque $\\sigma/\\omega\\varepsilon$ aumenta",
      ),
      x("No cambia: depende solo de $\\sigma$"),
      x("Se vuelve conductor ideal"),
    ],
    explain:
      "$\\omega$ está en el denominador del factor: el mismo material puede ser conductor a baja frecuencia y dieléctrico a alta.",
  },
  {
    id: "q-paralelos-repel",
    cardId: "paralelos",
    prompt:
      "Dos conductores rectos paralelos con corrientes de igual dirección y sentido opuesto:",
    options: [
      x("Se repelen"),
      x("Se atraen"),
      x("No interactúan"),
      x("Sienten un torque pero ninguna fuerza neta"),
    ],
    explain:
      "Con corrientes en el mismo sentido se atraen; con sentidos opuestos ($d\\vec l_2=-d\\vec l_1$) se repelen.",
  },
  {
    id: "q-biot-savart",
    cardId: "paralelos",
    prompt: "La ley de Biot–Savart para el campo de un circuito $C_1$ es:",
    options: [
      t(
        r`\vec B_{12}=\frac{\mu_0I_1}{4\pi}\oint_{C_1}\frac{d\vec l_1\times\hat a_{R12}}{R_{12}^2}`,
      ),
      t(
        r`\vec B_{12}=\frac{\mu_0I_1}{4\pi}\oint_{C_1}\frac{d\vec l_1\cdot\hat a_{R12}}{R_{12}^2}`,
      ),
      t(
        r`\vec B_{12}=\frac{\mu_0I_1}{4\pi}\oint_{C_1}\frac{d\vec l_1\times\hat a_{R12}}{R_{12}}`,
      ),
      t(
        r`\vec B_{12}=\frac{\mu_0I_1}{2\pi}\oint_{C_1}\frac{d\vec l_1\times\hat a_{R12}}{R_{12}^2}`,
      ),
    ],
    explain:
      "Producto vectorial, decae con $R^2$ y el factor es $\\mu_0/4\\pi$.",
  },
  {
    id: "q-b-hilo",
    cardId: "permeabilidad",
    prompt:
      "El campo de un conductor recto infinito a distancia $r$ (por Ampère) es:",
    options: [
      t(r`B=\frac{\mu_0I}{2\pi r}`),
      t(r`B=\frac{\mu_0I}{4\pi r}`),
      t(r`B=\frac{\mu_0I}{2\pi r^2}`),
      t(r`B=\frac{\mu_0Ir}{2\pi}`),
    ],
    explain: "$\\oint B\\,dl=B\\cdot2\\pi r=\\mu_0I$.",
  },
  {
    id: "q-mu0-expr",
    cardId: "permeabilidad",
    prompt: "Del balance de fuerzas sobre la espira, $\\mu_0$ se calcula como:",
    options: [
      t(
        r`\mu_0=\frac{2\pi|\vec F_m|}{I^2\left(\frac Ld-\frac{L-a}{d+h}\right)}`,
      ),
      t(r`\mu_0=\frac{2\pi|\vec F_m|}{I\left(\frac Ld-\frac{L-a}{d+h}\right)}`),
      t(
        r`\mu_0=\frac{|\vec F_m|}{2\pi I^2\left(\frac Ld-\frac{L-a}{d+h}\right)}`,
      ),
      t(
        r`\mu_0=\frac{2\pi|\vec F_m|}{I^2\left(\frac{L-a}{d}-\frac{L}{d+h}\right)}`,
      ),
    ],
    explain:
      "La fuerza va con $I^2$ (corriente por ambos), $2\\pi$ queda en el numerador y el lado inferior ($d$) lleva $L$, el superior ($d+h$) lleva $L-a$.",
  },
  {
    id: "q-c",
    cardId: "velocidad-luz",
    prompt:
      "De la ecuación de onda en el vacío, la velocidad de propagación es:",
    options: [
      t(r`v=\frac{1}{\sqrt{\mu_0\varepsilon_0}}`),
      t(r`v=\sqrt{\mu_0\varepsilon_0}`),
      t(r`v=\frac{1}{\mu_0\varepsilon_0}`),
      t(r`v=\sqrt{\frac{\mu_0}{\varepsilon_0}}`),
    ],
    explain:
      "De $\\mu_0\\varepsilon_0v^2=1$. La última opción es la impedancia del vacío, no una velocidad.",
  },
  {
    id: "q-identidad",
    cardId: "velocidad-luz",
    prompt:
      "¿Qué identidad vectorial se usa al tomar el rotor de la ley de Faraday?",
    options: [
      t(
        r`\nabla\times\nabla\times\vec E=\nabla(\nabla\cdot\vec E)-\nabla^2\vec E`,
      ),
      t(
        r`\nabla\times\nabla\times\vec E=\nabla(\nabla\cdot\vec E)+\nabla^2\vec E`,
      ),
      t(r`\nabla\times\nabla\times\vec E=\nabla\cdot(\nabla\vec E)`),
      t(r`\nabla\times\nabla\times\vec E=0`),
    ],
    explain:
      "Con $\\nabla\\cdot\\vec E=0$ queda $-\\nabla^2\\vec E$ y se llega a la ecuación de onda.",
  },
  {
    id: "q-continuidad-teo",
    cardId: "continuidad",
    prompt:
      "¿Qué teorema pasa de $\\oint_S\\vec J\\cdot d\\vec s$ a una integral de volumen en la deducción de la continuidad?",
    options: [
      x("El teorema de la divergencia"),
      x("El teorema de Stokes (del rotor)"),
      x("El teorema de Helmholtz"),
      x("El teorema de Poynting"),
    ],
    explain:
      "Flujo cerrado → divergencia en el volumen: $\\oint\\vec J\\cdot d\\vec s=\\int\\nabla\\cdot\\vec J\\,dV$.",
  },
  {
    id: "q-inductancia",
    cardId: "corriente-lineal",
    prompt: "Para un medio lineal, la inductancia es:",
    options: [
      t(r`L=\frac{\Phi_M}{I}`),
      t(r`L=\frac{I}{\Phi_M}`),
      t(r`L=\Phi_M\,I`),
      t(r`L=\frac{\Phi_M}{I^2}`),
    ],
    explain: "Flujo creado por cada ampere de corriente.",
  },
  {
    id: "q-energia-l",
    cardId: "corriente-lineal",
    prompt:
      "La energía magnética almacenada en un circuito con inductancia $L$ es:",
    options: [
      t(r`W_M=\tfrac12LI^2`),
      t(r`W_M=LI^2`),
      t(r`W_M=\tfrac12L^2I`),
      t(r`W_M=\tfrac12LI`),
    ],
    explain: "Análoga a $\\tfrac12CV^2$ en el campo eléctrico.",
  },
  {
    id: "q-l-depende",
    cardId: "corriente-lineal",
    prompt: "¿De qué depende la inductancia de un circuito en un medio lineal?",
    options: [
      x("Solo de la geometría del circuito y de $\\mu$, no de la corriente"),
      x("De la corriente que circula, de forma proporcional"),
      x("Solo de la tensión aplicada"),
      x("De la frecuencia de la corriente únicamente"),
    ],
    explain:
      "$\\vec A\\propto I$, así que el cociente $\\Phi_M/I$ es independiente de $I$.",
  },
  {
    id: "q-helmholtz",
    cardId: "postulados",
    prompt:
      "Según el teorema de Helmholtz, un campo vectorial queda determinado si se conocen:",
    options: [
      x("Su divergencia y su rotor en todos los puntos"),
      x("Solo su rotor"),
      x("Solo su divergencia"),
      x("Su potencial en la frontera únicamente"),
    ],
    explain:
      "Por eso los postulados de Maxwell especifican divergencia y rotor de $\\vec E$ y $\\vec B$.",
  },
  {
    id: "q-monopolos",
    cardId: "postulados",
    prompt: "$\\nabla\\cdot\\vec B=0$ significa que:",
    options: [
      x(
        "No hay cargas magnéticas aisladas: las líneas de $\\vec B$ son cerradas",
      ),
      x("El campo magnético es irrotacional"),
      x("El campo magnético es siempre nulo en el vacío"),
      x("Las corrientes no generan campo magnético"),
    ],
    explain:
      "$\\vec B$ es solenoidal, no irrotacional: su rotor es $\\mu(\\vec J+\\partial\\vec D/\\partial t)$.",
  },
  {
    id: "q-gauss",
    cardId: "postulados",
    prompt: "La ley de Gauss $\\nabla\\cdot\\vec D=\\rho_v$ indica que:",
    options: [
      x("Las cargas son las fuentes escalares del campo eléctrico"),
      x("Las cargas son las fuentes vectoriales del campo magnético"),
      x("El campo eléctrico siempre es solenoidal"),
      x("La carga total no se conserva"),
    ],
    explain:
      "Divergencia = fuentes escalares; el rotor de $\\vec E$ lo gobierna Faraday.",
  },
];
