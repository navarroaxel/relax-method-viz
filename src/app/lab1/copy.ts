import type { DiagramLabels } from "@/components/Lab1Diagram";
import type { Language } from "@/contexts/LanguageContext";

/**
 * Copy for the Laboratorio 1 page. It lives here rather than in
 * LanguageContext's global key table because it is long-form prose used by a
 * single route — the shared table is for the simulator chrome.
 */
export interface Lab1Copy {
  backToSim: string;
  title: string;
  subtitle: string;
  source: string;

  goalTitle: string;
  goalBody: string;
  formula: string;
  formulaNote: string;
  errorFormula: string;
  errorNote: string;

  setupTitle: string;
  setupSteps: string[];
  setupWarning: string;
  diagramTitle: string;
  diagramBody: string;
  diagram: DiagramLabels;

  stepTitle: string;
  stepBody: string;
  inrushNote: string;
  markersToggle: string;
  chartTime: string;
  chartForce: string;
  chartCurrent: string;
  chartField: string;
  hoverHint: string;
  bandLabel: string;

  markerOnset: string;
  markerT10: string;
  markerT90: string;
  markerPeak: string;
  markerSettle: string;

  metricsTitle: string;
  mForceSteady: string;
  mCurrentSteady: string;
  mRise: string;
  mOvershoot: string;
  mSettle: string;
  mZeta: string;
  mNatFreq: string;
  mField: string;

  lessonTitle: string;
  lessonBody: string[];

  fieldTitle: string;
  fieldBody: string;
  fieldCompare: (measured: string, direct: string, deltaPct: string) => string;

  checklistTitle: string;
  checklist: string[];

  bridgeTitle: string;
  bridgeBody: string;
}

const ES: Lab1Copy = {
  backToSim: "← Volver al simulador",
  title: "Laboratorio 1 — Fuerzas entre corrientes y campos magnéticos",
  subtitle:
    "Cómo leer el ensayo del solenoide a partir del registro de escalón: qué se mide, qué tarda en responder y qué campo sale de ahí.",
  source:
    "Fuente: guía GL-950526-2 (Cátedra Teoría de los Campos, UTN.BA) y la hoja «Escalon» de lab1.xlsx — 1001 muestras a 1 ms.",

  goalTitle: "1. Qué se mide y por qué",
  goalBody:
    "Un solenoide sin núcleo, alimentado con 5 A, genera un campo B homogéneo en su interior. Dentro de ese campo se sumerge un bucle conductor de 8 cm por el que circula una corriente I regulable de 0 a 12 A. La fuerza de Lorentz sobre un tramo recto perpendicular al campo vale F = I·l·B, así que basta medir F e I para despejar el campo:",
  formula: "B = F / (I · l)",
  formulaNote:
    "con l = 8 cm, la longitud del bucle. El sensor de fuerza entra al CASSY por la entrada A (F_A1) y la corriente del bucle por la entrada B (I_B1); ambas se registran en simultáneo.",
  errorFormula: "ΔB = (F/I²l)·ΔI + (F/I l²)·Δl + (1/I l)·ΔF",
  errorNote:
    "El error absoluto se propaga como la suma de las derivadas parciales de B respecto de I, l y F, evaluadas en cada punto de medición. El resultado se informa como B ± ΔB.",

  setupTitle: "2. El montaje",
  setupSteps: [
    "El sensor de fuerza sostiene el bucle conductor de 8 cm y lo baja hasta que quede sumergido entre las espiras del solenoide, sin tocarlo.",
    "La fuente de 20 A alimenta el bucle a través de la unidad 30-A y de la entrada B del CASSY (medición de I).",
    "La fuente de 5 A alimenta la bobina sin núcleo, que es la que crea el campo.",
    "El sensor de fuerza se conecta a la entrada A del CASSY mediante la unidad Puente.",
    "Antes de medir: poner el sensor de fuerza en cero (→0← en Ajustes Fuerza FA1) y corregir el offset de corriente a 0 A.",
    "Luego se sube I de 0 a 12 A en pasos de 2 A, registrando un punto con F9 en cada escalón.",
  ],
  setupWarning:
    "El bucle y su soporte sólo toleran corrientes de hasta 20 A por poco tiempo: el barrido hay que hacerlo rápido. Si todas las fuerzas salen negativas, se invierten las conexiones del soporte.",

  diagramTitle: "El banco, en movimiento",
  diagramBody:
    "Esquema del montaje de la figura 2.1 de la guía. El trazo punteado marca por dónde circula cada corriente: la del solenoide (fija en 5 A) y la del bucle (variable). Ojo con el circuito del bucle: la entrada B del CASSY mide corriente, así que va en serie —entra por un borne y sale por el otro—, y de ahí la corriente sigue al bucle y vuelve a la fuente. Movés el deslizador para ver cómo crece la fuerza sobre el bucle con la corriente, o le das a reproducir para que la animación siga el registro de escalón real — ahí se ve lo importante: la corriente salta de golpe y el bucle llega tarde, se pasa de largo y recién después se acomoda.",
  diagram: {
    supply20: "Fuente bucle",
    supply5: "Fuente bobina",
    cassy: "Sensor CASSY",
    forceSensor: "Sensor de fuerza",
    support: "Estructura soporte",
    solenoid: "Solenoide",
    loop: "Espira conductora",
    fieldB: "B",
    forceF: "F",
    loopCurrent: "I bucle",
    coilCurrent: "I bobina",
    speed: "Velocidad",
    play: "▶ Reproducir el escalón",
    pause: "■ Detener",
    replayHint:
      "Reproduciendo la captura real en bucle. Toda la parte interesante dura unas décimas de segundo, así que bajá la velocidad para verla: la corriente ya está arriba mientras la espira todavía está subiendo.",
    manualHint:
      "Modo manual: la fuerza se calcula como F = I · l · B con el campo medido. El barrido del ensayo va de 0 a 12 A en pasos de 2 A.",
    elapsed: "t",
  },

  stepTitle: "3. El registro de escalón",
  stepBody:
    "Esta captura no es una medición de campo: es la respuesta del banco a un escalón de corriente. La corriente pasa de ~1 A a 20,2 A en unos 2 ms —para el sensor, un escalón perfecto— y a partir de ahí todo lo que hace la curva de fuerza es respuesta mecánica del sensor, no física del campo. Pasá el cursor por el gráfico para leer valores.",
  inrushNote:
    "¿Y por qué no hay pico de arranque (inrush)? Porque en este circuito no hay nada que lo produzca. Un inrush aparece cuando algo pide por un instante mucha más corriente que en régimen: un núcleo de hierro que se satura al energizarse, o un capacitor de filtro descargado. Acá la carga es el bucle de 8 cm con sus cables —prácticamente resistiva, sin núcleo ni capacidad—, y la bobina, que sí es inductiva, es sin núcleo: una inductancia sin hierro no satura, así que al energizarse crece exponencialmente hacia su valor final y nunca por encima (y además está en el otro circuito, estabilizada en 5 A desde antes de la captura). A eso se suma que la fuente es electrónica regulada con límite de corriente: su lazo de control lleva la corriente a la consigna y la sujeta ahí. La medición es coherente con eso — subida monótona con τ ≈ 1 ms, 99 % del valor final a los 4 ms y una excursión máxima de 0,6 % sobre el régimen, dentro del ruido propio del canal (±0,1 A). Ese τ de 1 ms es además demasiado lento para la inductancia del bucle (del orden de 1 µH, que se establecería en decenas de microsegundos), así que lo que se ve es el lazo de la fuente y no la carga. En este banco lo único que oscila es la mecánica del sensor.",
  markersToggle: "Marcar los tiempos característicos",
  chartTime: "t (s)",
  chartForce: "F (mN)",
  chartCurrent: "I (A)",
  chartField: "B (mT)",
  hoverHint: "Pasá el cursor sobre el gráfico para leer un instante.",
  bandLabel: "±2 % de F final",

  markerOnset: "arranque",
  markerT10: "10 %",
  markerT90: "90 %",
  markerPeak: "pico",
  markerSettle: "asentado ±2 %",

  metricsTitle: "Figuras de mérito del escalón",
  mForceSteady: "F de régimen",
  mCurrentSteady: "I de régimen",
  mRise: "Tiempo de subida (10→90 %)",
  mOvershoot: "Sobrepico",
  mSettle: "Tiempo de asentamiento (±2 %)",
  mZeta: "Amortiguamiento ζ equivalente",
  mNatFreq: "Frecuencia natural f_n",
  mField: "B = F/(I·l) en régimen",

  lessonTitle: "4. Lo que el escalón te dice sobre cómo medir",
  lessonBody: [
    "La corriente ya está en su valor final cuando la fuerza todavía no arrancó: el sensor recién despega unas decenas de milisegundos después, tarda más de 0,1 s en ir del 10 % al 90 %, y se pasa de largo antes de volver.",
    "Ese sobrepico y la oscilación posterior son la firma de un sistema de segundo orden subamortiguado: la balanza de fuerzas es un resorte con masa y rozamiento, no un instrumento instantáneo.",
    "Consecuencia práctica: si en el barrido de 0 a 12 A apretás F9 apenas moviste la perilla, estás registrando un punto de la transición y no el valor de régimen — la fuerza queda sobreestimada o subestimada según dónde caigas en la oscilación.",
    "El compromiso del ensayo está acá: la guía pide hacerlo rápido porque el bucle no aguanta 20 A mucho tiempo, pero cada punto necesita el tiempo de asentamiento que se mide abajo. Ese es el número que hay que respetar entre escalón y escalón.",
  ],

  fieldTitle: "5. De la fuerza al campo",
  fieldBody:
    "Aplicando B = F/(I·l) muestra a muestra se ve lo mismo desde el otro lado: mientras el sensor todavía se está acomodando, el «campo» calculado no significa nada; recién cuando la fuerza se asienta, el cociente se estabiliza en el valor real.",
  fieldCompare: (measured, direct, deltaPct) =>
    `El valor de régimen da B = ${measured} mT. La medición directa con la sonda de campo (hoja «Medicion_directa») da ${direct} mT en su meseta: una diferencia del ${deltaPct} %, dentro de lo esperable para un método indirecto con un solo punto de corriente.`,

  checklistTitle: "6. Qué pide el informe",
  checklist: [
    "Tabla del instrumental usado con alcance y error de cada equipo (trazabilidad).",
    "Gráficos separados de F vs I y de B vs I, con cotas de error en el segundo.",
    "Valor promedio del campo magnético y su error.",
    "Campo calculado con la expresión teórica del solenoide (B = μ₀·n·I).",
    "Comparación de los tres resultados: fuerza, teoría y medición directa.",
    "Conclusiones al comienzo del documento, a continuación de los objetivos.",
  ],

  bridgeTitle: "Relación con el simulador",
  bridgeBody:
    "Este laboratorio es la contraparte magnetostática de lo que resuelve el simulador de esta misma app: allá se relaja la ecuación de Laplace para el potencial eléctrico V y se obtiene E = −∇V; acá el campo B se obtiene midiendo la fuerza sobre una corriente conocida. En los dos casos el paso interesante es el mismo: pasar de una magnitud medible a un campo que no se ve.",
};

const EN: Lab1Copy = {
  backToSim: "← Back to the simulator",
  title: "Lab 1 — Forces between currents and magnetic fields",
  subtitle:
    "How to read the solenoid experiment from its step record: what is measured, how slowly it responds, and what field comes out of it.",
  source:
    "Source: guide GL-950526-2 (Cátedra Teoría de los Campos, UTN.BA) and the «Escalon» sheet of lab1.xlsx — 1001 samples at 1 ms.",

  goalTitle: "1. What is measured, and why",
  goalBody:
    "An air-core solenoid driven at 5 A produces a uniform field B inside it. An 8 cm conductor loop carrying an adjustable current I (0 to 12 A) is lowered into that field. The Lorentz force on a straight segment perpendicular to the field is F = I·l·B, so measuring F and I is enough to solve for the field:",
  formula: "B = F / (I · l)",
  formulaNote:
    "with l = 8 cm, the loop length. The force sensor feeds CASSY input A (F_A1) and the loop current feeds input B (I_B1); both are logged simultaneously.",
  errorFormula: "ΔB = (F/I²l)·ΔI + (F/I l²)·Δl + (1/I l)·ΔF",
  errorNote:
    "The absolute error propagates as the sum of the partial derivatives of B with respect to I, l and F, evaluated at each measurement point. The result is reported as B ± ΔB.",

  setupTitle: "2. The bench",
  setupSteps: [
    "The force sensor holds the 8 cm conductor loop and lowers it between the solenoid windings without touching them.",
    "The 20 A supply drives the loop through the 30-A unit and CASSY input B (current measurement).",
    "The 5 A supply drives the air-core coil, which is what creates the field.",
    "The force sensor connects to CASSY input A through the Bridge unit.",
    "Before measuring: zero the force sensor (→0← in Force FA1 settings) and correct the current offset to 0 A.",
    "Then raise I from 0 to 12 A in 2 A steps, recording one point with F9 at each step.",
  ],
  setupWarning:
    "The loop and its holder only tolerate currents up to 20 A for a short time: the sweep has to be quick. If every force reads negative, swap the connections on the holder.",

  diagramTitle: "The bench, in motion",
  diagramBody:
    "Schematic of the setup from figure 2.1 of the guide. The dashed strokes trace where each current flows: the solenoid's (fixed at 5 A) and the loop's (variable). Note the loop circuit: CASSY input B measures current, so it sits in series — in through one terminal and out through the other — and from there the current goes on to the loop and back to the supply. Drag the slider to see the force on the loop grow with current, or hit play to drive the animation from the real step record — that is where the point lands: the current jumps at once while the loop arrives late, overshoots, and only then settles.",
  diagram: {
    supply20: "Loop supply",
    supply5: "Coil supply",
    cassy: "CASSY sensor",
    forceSensor: "Force sensor",
    support: "Support structure",
    solenoid: "Solenoid",
    loop: "Conductor loop",
    fieldB: "B",
    forceF: "F",
    loopCurrent: "I loop",
    coilCurrent: "I coil",
    speed: "Speed",
    play: "▶ Play the step",
    pause: "■ Stop",
    replayHint:
      "Replaying the real capture on a loop. The interesting part lasts a few tenths of a second, so slow it down to watch it: the current is already up while the loop is still rising.",
    manualHint:
      "Manual mode: force is computed as F = I · l · B with the measured field. The experiment's sweep runs 0 to 12 A in 2 A steps.",
    elapsed: "t",
  },

  stepTitle: "3. The step record",
  stepBody:
    "This capture is not a field measurement: it is the bench's response to a current step. The current goes from ~1 A to 20.2 A in about 2 ms — a perfect step as far as the sensor is concerned — and everything the force curve does afterwards is the sensor's mechanical response, not field physics. Hover the chart to read values.",
  inrushNote:
    "So why is there no inrush peak? Because nothing in this circuit can produce one. Inrush appears when something momentarily draws far more current than it does in steady state: an iron core saturating as it is energised, or a discharged bulk capacitor. Here the load is the 8 cm loop and its leads — essentially resistive, with no core and no capacitance — and the coil, which is the inductive part, is air-core: an inductor without iron cannot saturate, so energising it grows exponentially towards its final value and never above it (and it is on the other circuit anyway, settled at 5 A well before this capture). On top of that the supply is an electronically regulated, current-limited source: its control loop drives the current to the setpoint and holds it there. The measurement agrees — a monotonic rise with τ ≈ 1 ms, 99 % of the final value by 4 ms, and a largest excursion of 0.6 % above steady state, within the channel's own noise (±0.1 A). That 1 ms is also far too slow for the loop's own inductance (of order 1 µH, which would settle in tens of microseconds), so what we see is the supply's loop rather than the load. On this bench the only thing that rings is the sensor's mechanics.",
  markersToggle: "Mark the characteristic times",
  chartTime: "t (s)",
  chartForce: "F (mN)",
  chartCurrent: "I (A)",
  chartField: "B (mT)",
  hoverHint: "Hover the chart to read a single instant.",
  bandLabel: "±2 % of final F",

  markerOnset: "onset",
  markerT10: "10 %",
  markerT90: "90 %",
  markerPeak: "peak",
  markerSettle: "settled ±2 %",

  metricsTitle: "Step figures of merit",
  mForceSteady: "Steady-state F",
  mCurrentSteady: "Steady-state I",
  mRise: "Rise time (10→90 %)",
  mOvershoot: "Overshoot",
  mSettle: "Settling time (±2 %)",
  mZeta: "Equivalent damping ζ",
  mNatFreq: "Natural frequency f_n",
  mField: "B = F/(I·l) at steady state",

  lessonTitle: "4. What the step tells you about how to measure",
  lessonBody: [
    "The current has already reached its final value while the force has not even started to move: the sensor only lifts off tens of milliseconds later, takes over 0.1 s to go from 10 % to 90 %, and overshoots before coming back.",
    "That overshoot and the ringing after it are the signature of an underdamped second-order system: the force balance is a spring with mass and friction, not an instantaneous instrument.",
    "Practical consequence: if during the 0-to-12 A sweep you hit F9 right after turning the knob, you are recording a point of the transient, not the steady value — the force ends up over- or underestimated depending on where in the ringing you land.",
    "This is the trade-off of the experiment: the guide asks you to work fast because the loop cannot hold 20 A for long, yet each point needs the settling time measured below. That is the number to respect between steps.",
  ],

  fieldTitle: "5. From force to field",
  fieldBody:
    "Applying B = F/(I·l) sample by sample shows the same thing from the other side: while the sensor is still settling, the computed «field» means nothing; only once the force settles does the ratio stabilise at the real value.",
  fieldCompare: (measured, direct, deltaPct) =>
    `The steady-state value gives B = ${measured} mT. The direct field probe («Medicion_directa» sheet) reads ${direct} mT on its plateau: a ${deltaPct} % difference, well within what an indirect method at a single current point can be expected to give.`,

  checklistTitle: "6. What the report asks for",
  checklist: [
    "A table of the instruments used, with range and error for each (traceability).",
    "Separate plots of F vs I and B vs I, with error bars on the second one.",
    "The average magnetic field and its error.",
    "The field computed from the theoretical solenoid expression (B = μ₀·n·I).",
    "A comparison of the three results: force method, theory, and direct measurement.",
    "Conclusions at the start of the document, right after the objectives.",
  ],

  bridgeTitle: "How this relates to the simulator",
  bridgeBody:
    "This lab is the magnetostatic counterpart of what the simulator in this same app solves: there, Laplace's equation is relaxed for the electric potential V and E = −∇V follows; here, B is obtained by measuring the force on a known current. In both cases the interesting step is the same — going from a measurable quantity to a field you cannot see.",
};

export const LAB1_COPY: Record<Language, Lab1Copy> = { es: ES, en: EN };
