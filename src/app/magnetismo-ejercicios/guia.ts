/** Índice de la guía de ejercicios de TdC, del 24 al 61. */

export type GuideRow =
  | { num: number; title: string; kind: "practica"; exerciseId: string }
  | { num: number; title: string; kind: "teoria"; note: string }
  | {
      num: number;
      title: string;
      kind: "sin-resolver";
      statement: string;
      /** Aclaración sobre lo que trae (o no) el PDF resuelto. */
      note: string;
    };

const NO_SOLUTION = "El PDF resuelto solo trae el enunciado de este ejercicio.";

export const GUIDE_ROWS: GuideRow[] = [
  {
    num: 24,
    title: "Cable con aislante: capacidad y tensión máxima",
    kind: "practica",
    exerciseId: "g24",
  },
  {
    num: 25,
    title: "Conductor sólido: B dentro y fuera",
    kind: "practica",
    exerciseId: "g25",
  },
  {
    num: 26,
    title: "Bobina toroidal: inducción interior",
    kind: "practica",
    exerciseId: "g26",
  },
  {
    num: 27,
    title: "Tubo delgado con corriente superficial",
    kind: "practica",
    exerciseId: "g27",
  },
  { num: 28, title: "Solenoide largo", kind: "practica", exerciseId: "g28" },
  {
    num: 29,
    title: "Campo de un conductor finito",
    kind: "practica",
    exerciseId: "p-hilo-finito",
  },
  {
    num: 30,
    title: "Centro de una espira cuadrada",
    kind: "practica",
    exerciseId: "g30",
  },
  {
    num: 31,
    title: "Eje de una espira circular",
    kind: "practica",
    exerciseId: "g31",
  },
  {
    num: 32,
    title: "Autoinductancia del toroide",
    kind: "practica",
    exerciseId: "g32",
  },
  {
    num: 33,
    title: "Autoinductancia por metro de un solenoide",
    kind: "practica",
    exerciseId: "g33",
  },
  {
    num: 34,
    title: "Inductancia mutua: espira y hilo",
    kind: "practica",
    exerciseId: "p-fem-hilo",
  },
  {
    num: 35,
    title: "Energía magnética en términos de los campos",
    kind: "teoria",
    note: "Es un ejercicio de teoría: en la página de teoría está como juego de ordenar la deducción.",
  },
  {
    num: 36,
    title: "Línea coaxial: inductancia por energía",
    kind: "practica",
    exerciseId: "g36",
  },
  {
    num: 37,
    title: "Línea de dos alambres",
    kind: "practica",
    exerciseId: "g37",
  },
  {
    num: 38,
    title: "Fuerza entre dos alambres paralelos",
    kind: "practica",
    exerciseId: "g38",
  },
  {
    num: 39,
    title: "Fuerza y par sobre una espira en B uniforme",
    kind: "practica",
    exerciseId: "g39",
  },
  {
    num: 40,
    title: "Fuerza neta sobre la espira con $I_2$ horaria",
    kind: "sin-resolver",
    statement:
      "Suponga que una corriente $I_2$ circula por la espira rectangular en el sentido de las agujas del reloj. Determine la fuerza neta sobre la espira. (Figura de la guía: un conductor recto con $I_1$ a una distancia $d$ de la espira, de ancho $w$ y alto $h$.)",
    note: NO_SOLUTION,
  },
  {
    num: 41,
    title: "Fuerza sobre la armadura de un electroimán",
    kind: "sin-resolver",
    statement:
      "Considere un electroimán donde la corriente $I$ en una bobina de $N$ vueltas produce un flujo $\\Phi$ en el circuito magnético. La sección transversal del núcleo es $s$. Determine la fuerza sobre la armadura.",
    note: NO_SOLUTION,
  },
  {
    num: 42,
    title: "Corriente de desplazamiento en un capacitor",
    kind: "practica",
    exerciseId: "g42",
  },
  {
    num: 43,
    title: "$f(x-vt)$ como solución de la onda plana",
    kind: "practica",
    exerciseId: "g43",
  },
  {
    num: 44,
    title: "Ondas $Ae^{j\\beta x}$, $\\cos\\beta x$ y $\\sin ax\\cos bx$",
    kind: "practica",
    exerciseId: "g43",
  },
  {
    num: 45,
    title: "Onda plana en un dieléctrico: cuadratura e impedancia",
    kind: "sin-resolver",
    statement:
      "Demuestre que en una onda plana que se propaga en un medio dieléctrico, las componentes eléctrica y magnética de la onda poseen cuadratura espacial y fase temporal. Calcule la impedancia intrínseca del medio.",
    note: "La resolución del PDF está incompleta: plantea las ecuaciones de Maxwell y llega a $v=1/\\sqrt{\\mu\\varepsilon}$, pero se corta antes de la cuadratura y de la impedancia.",
  },
  {
    num: 46,
    title: "Onda plana en un medio conductor",
    kind: "sin-resolver",
    statement:
      "Determine las componentes de una onda electromagnética plana que se propaga por un medio conductor y demuestre que las mismas poseen desfase temporal. Determine la expresión de la impedancia intrínseca del medio conductor.",
    note: NO_SOLUTION,
  },
  {
    num: 47,
    title: "Ondas de radio en el agua (submarino)",
    kind: "practica",
    exerciseId: "g47",
  },
  {
    num: 48,
    title: "Corriente de conducción vs de desplazamiento",
    kind: "practica",
    exerciseId: "g48",
  },
  {
    num: 49,
    title: "Onda plana en un dieléctrico: β, v y H",
    kind: "practica",
    exerciseId: "g49",
  },
  {
    num: 50,
    title: "Grafito: conductividad y atenuación",
    kind: "practica",
    exerciseId: "g50",
  },
  {
    num: 51,
    title: "Potencia que entra a un conductor: $P=I^2R_C$",
    kind: "sin-resolver",
    statement:
      "Demuestre que en un conductor de resistencia $R_C$ que transporta corriente $I$, la potencia que penetra al mismo es $P=I^2R_C$.",
    note: NO_SOLUTION,
  },
  {
    num: 52,
    title: "Vector de Poynting en un coaxial en continua",
    kind: "practica",
    exerciseId: "g52",
  },
  {
    num: 53,
    title: "Irradiación solar: $E$ y $H$ máximos",
    kind: "sin-resolver",
    statement:
      "La irradiación (potencia por unidad de superficie) solar en la superficie terrestre en el espectro visible tiene un valor medio de $1100\\,\\mathrm{W/m^2}$. Considerando una onda plana, calcular las intensidades máximas de campo eléctrico $\\vec E$ y magnético $\\vec H$.",
    note: NO_SOLUTION,
  },
  {
    num: 54,
    title: "Transformación de Lorentz de un evento",
    kind: "sin-resolver",
    statement:
      "Un evento ocurre en el sistema $S$ en $x=100\\,\\mathrm{km}$, $y=10\\,\\mathrm{km}$, $z=1\\,\\mathrm{km}$, $t=2\\cdot10^{-4}\\,\\mathrm{s}$. El sistema $S'$ se mueve a $0{,}95c$ a lo largo del eje común $xx'$ con respecto a $S$ y los orígenes coinciden en $t=t'=0$. ¿Cuáles son las coordenadas de este acontecimiento en $S'$?",
    note: NO_SOLUTION,
  },
  {
    num: 55,
    title: "Sistema donde dos eventos son simultáneos",
    kind: "sin-resolver",
    statement:
      "Desde el sistema inercial $S$ se ve que en un punto $A$ del eje $x$ ocurre un acontecimiento, y $10^{-6}\\,\\mathrm{s}$ más tarde ocurre otro en un punto $B$ más allá sobre el mismo eje. Según $S$, entre $A$ y $B$ hay $600\\,\\mathrm{m}$. ¿Hay algún otro sistema $S'$ que se mueva a una velocidad menor que $c$ desde el cual los dos acontecimientos aparezcan simultáneos? Si es así, ¿cuál es la magnitud y la dirección de la velocidad de $S'$ respecto a $S$? ¿Cuál es la separación de $A$ y $B$ según $S'$?",
    note: NO_SOLUTION,
  },
  {
    num: 56,
    title: "Paradoja de los gemelos",
    kind: "sin-resolver",
    statement:
      "Un hombre abandona la Tierra en una nave que hace el recorrido de ida y vuelta a una estrella situada a $4$ años luz, a la velocidad de $0{,}8c$. A su regreso a la Tierra, ¿cuánto tiempo es más joven que su hermano gemelo que permaneció en ella?",
    note: NO_SOLUTION,
  },
  {
    num: 57,
    title: "Velocidad relativa de dos proyectiles",
    kind: "sin-resolver",
    statement:
      "Un observador en un sistema inercial $S$ informa que dos proyectiles se mueven en línea recta, paralelamente uno respecto del otro, en curso de colisión, el primero a $0{,}9c$ y el segundo a $0{,}7c$. Encuentre la velocidad de un proyectil respecto al otro.",
    note: NO_SOLUTION,
  },
  {
    num: 58,
    title: "Electrón con $E_c=E_0$",
    kind: "sin-resolver",
    statement:
      "¿Cuál es la velocidad de un electrón cuya energía cinética es igual a su energía en reposo?",
    note: NO_SOLUTION,
  },
  {
    num: 59,
    title: "Energía por kilogramo para llegar a $0{,}98c$",
    kind: "sin-resolver",
    statement:
      "¿Cuánta energía por kilogramo de masa en reposo es necesaria para acelerar una nave hasta la velocidad $0{,}98c$?",
    note: NO_SOLUTION,
  },
  {
    num: 60,
    title: "Fisión del uranio: energía por kg",
    kind: "sin-resolver",
    statement:
      "Dada la reacción de fisión nuclear del uranio, ${}^{1}_{0}n+{}^{235}_{92}U\\to{}^{141}_{56}Ba+{}^{92}_{36}Kr+3\\,{}^{1}_{0}n$, calcular la energía liberada por kg de combustible en el proceso. Masas en reposo: $m_0({}^{235}U)=3{,}9029962\\cdot10^{-22}\\,\\mathrm{g}$, $m_0({}^{92}Kr)=1{,}5264697\\cdot10^{-22}\\,\\mathrm{g}$, $m_0({}^{141}Ba)=2{,}3399388\\cdot10^{-22}\\,\\mathrm{g}$, $m_0(n)=1{,}6749274\\cdot10^{-24}\\,\\mathrm{g}$.",
    note: NO_SOLUTION,
  },
  {
    num: 61,
    title: "Fusión deuterio-tritio: energía por kg",
    kind: "sin-resolver",
    statement:
      "Dada la reacción de fusión nuclear deuterio-tritio, ${}^{2}_{1}H+{}^{3}_{1}H\\to{}^{4}_{2}He+{}^{1}_{0}n$, calcular la energía liberada por kg de combustible en el proceso. Masas en reposo: $m_0({}^{2}H)=3{,}343584\\cdot10^{-24}\\,\\mathrm{g}$, $m_0({}^{3}H)=5{,}008268\\cdot10^{-24}\\,\\mathrm{g}$, $m_0({}^{4}He)=6{,}646477\\cdot10^{-24}\\,\\mathrm{g}$, $m_0(n)=1{,}6749274\\cdot10^{-24}\\,\\mathrm{g}$.",
    note: NO_SOLUTION,
  },
];
