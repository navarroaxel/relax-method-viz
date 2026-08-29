import type { CompassDiagramLabels } from "@/components/Lab1CompassDiagram";
import type { DirectDiagramLabels } from "@/components/Lab1DirectDiagram";
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

  rampTitle: string;
  rampBody: string;
  rampTimeBody: string;
  rampHysteresis: string;
  rampLagNote: string;
  rampDelayNote: string;
  rampAxisI: string;
  rampAxisF: string;
  rampRising: string;
  rampFalling: string;
  rampOverallFit: string;
  rampRisingFit: string;
  rampFallingFit: string;
  mPeak: string;
  mRate: string;
  mSlope: string;
  mR2: string;
  mTare: string;
  mFieldRamp: string;
  mHysteresis: string;
  mLag: string;
  mDelayStep: string;
  mLoop: string;
  mLoopExplained: string;

  indirectTitle: string;
  indirectBody: string;
  indirectOutlierNote: string;
  indirectAxisI: string;
  indirectAxisF: string;
  indirectOutlierLabel: string;
  mSessions: string;
  mIndirectPoints: string;
  mIndirectOutliers: string;
  mFieldIndirect: string;
  mFieldSpread: string;

  directTitle: string;
  directBody: string;
  directCompassNote: string;
  compassDiagram: CompassDiagramLabels;
  directDiagram: DirectDiagramLabels;
  directOrthogonalNote: string;
  directValidityNote: string;
  chartN: string;
  markerEnd: string;
  markerOutside: string;
  markerCenter: string;
  mCenterField: string;
  mEndField: string;
  mEndRatio: string;
  mOutsideField: string;
  mCoilCurrent: string;

  fieldTitle: string;
  fieldBody: string;
  fieldCompare: (measured: string, direct: string, deltaPct: string) => string;
  fieldThree: (ramp: string, spreadPct: string) => string;
  fieldFour: (indirect: string, spreadPct: string) => string;
  averageTitle: string;
  fieldAverage: (avgMt: string, errorMt: string) => string;
  mFieldAverage: string;
  theoryTitle: string;
  fieldTheory: (theoryMt: string, theoryErrorMt: string, deltaPct: string) => string;
  fieldCalculatedVsDirect: (forcePct: string, theoryPct: string) => string;
  mTheoryField: string;
  mTheoryTurns: string;
  mTheoryLength: string;
  mTheoryDelta: string;

  conclusionsTitle: string;
  conclusionsBody: string[];

  bridgeTitle: string;
  bridgeBody: string;
}

const ES: Lab1Copy = {
  backToSim: "← Volver al simulador",
  title: "Laboratorio 1 — Fuerzas entre corrientes y campos magnéticos",
  subtitle:
    "Cómo leer el ensayo del solenoide a través de sus cuatro mediciones —directa con sonda, indirecta por puntos, continua y de escalón—: qué mide cada una, por qué hace falta el CASSY para captar fuerzas tan chicas, y qué campo produce ese flujo de corriente.",
  source:
    "Fuente: guía GL-950526-2 (Cátedra Teoría de los Campos, UTN.BA) y mediciones registradas en el laboratorio.",

  goalTitle: "1. Qué se mide y por qué",
  goalBody:
    "Un solenoide sin núcleo, alimentado con 5 A, genera un campo B homogéneo en su interior. Dentro de ese campo se sumerge un bucle conductor de 8,1 cm por el que circula una corriente I regulable de 0 a 12 A. La fuerza de Lorentz sobre un tramo recto perpendicular al campo vale F = I·l·B, así que basta medir F e I para despejar el campo:",
  formula: "B = F / (I · l)",
  formulaNote:
    "con l = 8,1 cm, la longitud del bucle medida a mano (la guía da 8 cm nominales). El sensor de fuerza entra al CASSY por la entrada A (F_A1) y la corriente del bucle por la entrada B (I_B1); ambas se registran en simultáneo.",
  errorFormula: "ΔB = (F/I²l)·ΔI + (F/I l²)·Δl + (1/I l)·ΔF",
  errorNote:
    "El error absoluto se propaga como la suma de las derivadas parciales de B respecto de I, l y F, evaluadas en cada punto de medición. El resultado se informa como B ± ΔB.",

  setupTitle: "3. El montaje",
  setupSteps: [
    "El sensor de fuerza sostiene el bucle conductor de 8,1 cm y lo baja hasta que quede sumergido entre las espiras del solenoide, sin tocarlo.",
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
    "Esquema del montaje de la figura 2.1 de la guía. El trazo punteado marca por dónde circula cada corriente: la del solenoide (fija en 5 A) y la del bucle (variable). Ojo con el circuito del bucle: la entrada B del CASSY mide corriente, así que va en serie —entra por un borne y sale por el otro—, y de ahí la corriente sigue al bucle y vuelve a la fuente. Mueva el slider para ver cómo crece la fuerza sobre el bucle con la corriente, o reproduzca cualquiera de las dos capturas reales para que la animación siga los datos. En la captura del escalón de corriente se ve lo importante: la corriente salta de golpe y el bucle llega tarde, se pasa de largo y recién después se acomoda. En la medición continua se ve el otro extremo: la perilla movida a mano durante 20 s, con el sensor siguiéndola de cerca.",
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
    playStep: "▶ Escalón",
    playRamp: "▶ Medición continua",
    pause: "■ Detener",
    replayHint:
      "Reproduciendo el escalón real en bucle. Toda la parte interesante dura unas décimas de segundo, así que baje la velocidad para verla: la corriente ya está arriba mientras la espira todavía está subiendo.",
    replayRampHint:
      "Reproduciendo la medición continua en bucle: los 20 s de la perilla movida a mano, subiendo hasta 20 A y volviendo. A este ritmo el sensor sigue a la corriente de cerca — el retardo está ahí igual, pero hace falta el gráfico para verlo.",
    manualHint:
      "Modo manual: la fuerza se calcula como F = I · l · B con el campo medido. El barrido del ensayo va de 0 a 12 A en pasos de 2 A.",
    elapsed: "t",
  },

  stepTitle: "5. Captura del escalón de corriente",
  stepBody:
    "Esta captura no mide el campo: registra la respuesta mecánica del banco frente a un escalón de corriente, es decir, un salto brusco e instantáneo. La corriente pasa de ~1 A a 20,2 A en unos 2 ms, un escalón prácticamente perfecto para el sensor, y a partir de ahí todo lo que hace la curva de fuerza es la respuesta del sensor, no física del campo. Deslice el cursor por el gráfico para leer valores.",
  inrushNote:
    "¿Y por qué no hay pico de arranque (inrush)? Porque en este circuito no hay nada que lo produzca. Un inrush aparece cuando algo pide por un instante mucha más corriente que en régimen: un núcleo de hierro que se satura al energizarse, o un capacitor de filtro descargado. Acá la carga es el bucle de 8,1 cm con sus cables —prácticamente resistiva, sin núcleo ni capacidad—, y la bobina, que sí es inductiva, es sin núcleo: una inductancia sin hierro no satura, así que al energizarse crece exponencialmente hacia su valor final y nunca por encima (y además está en el otro circuito, estabilizada en 5 A desde antes de la captura). A eso se suma que la fuente es electrónica regulada con límite de corriente: su lazo de control lleva la corriente a la consigna y la sujeta ahí. La medición es coherente con eso — subida monótona con τ ≈ 1 ms, 99 % del valor final a los 4 ms y una excursión máxima de 0,6 % sobre el régimen, dentro del ruido propio del canal (±0,1 A). Ese τ de 1 ms es además demasiado lento para la inductancia del bucle (del orden de 1 µH, que se establecería en decenas de microsegundos), así que lo que se ve es el lazo de la fuente y no la carga. En este banco lo único que oscila es la mecánica del sensor.",
  markersToggle: "Marcar los tiempos característicos",
  chartTime: "t (s)",
  chartForce: "F (mN)",
  chartCurrent: "I (A)",
  chartField: "B (mT)",
  hoverHint: "Deslice el cursor sobre el gráfico para leer un instante.",
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

  lessonTitle: "6. Lo que el escalón te dice sobre cómo medir",
  lessonBody: [
    "La corriente ya está en su valor final cuando la fuerza todavía no arrancó: el sensor recién despega unas decenas de milisegundos después, tarda más de 0,1 s en ir del 10 % al 90 %, y se pasa de largo antes de volver.",
    "Ese sobrepico y la oscilación posterior son la firma de un sistema de segundo orden subamortiguado: la balanza de fuerzas es un resorte con masa y rozamiento, no un instrumento instantáneo.",
    "Consecuencia práctica: si durante el barrido de 0 a 12 A se presiona F9 apenas se movió la perilla, se registra un punto de la transición y no el valor de régimen — la fuerza queda sobreestimada o subestimada según en qué momento de la oscilación caiga la lectura.",
    "El compromiso del ensayo está acá: la guía pide hacerlo rápido porque el bucle no aguanta 20 A mucho tiempo, pero cada punto necesita el tiempo de asentamiento que se mide abajo. Ese es el número que hay que respetar entre escalón y escalón.",
  ],

  rampTitle: "7. La medición continua",
  rampBody:
    "Se realiza una medición continua tal como se solicita en el informe: F en función de I. En vez de ir por escalones de 2 A, acá la perilla se mueve a mano de forma continua mientras el CASSY registra solo, 201 muestras cada 100 ms durante 20 s. La corriente sube hasta el pico y después vuelve a bajar, así que el registro tiene las dos ramas del barrido — y eso es lo que convierte el retardo del sensor en algo que se ve de una.",
  rampTimeBody:
    "Primero, el registro en el tiempo: se nota el pulso de la mano en la corriente, y la fuerza siguiéndola de cerca porque a este ritmo (≈1 A/s) el sensor tiene tiempo de acomodarse entre muestra y muestra.",
  rampHysteresis:
    "Al graficar F contra I aparece el detalle: la ida y la vuelta no se superponen. La rama de subida queda por debajo de la de bajada, y cada una ajusta a una recta distinta. El campo no cambió: el lazo que encierran las dos ramas es, literalmente, el error que se comete según para qué lado se esté moviendo la perilla. Un cuidado al leerlo: la rama de bajada sólo cubre de 13 a 20 A mientras la de subida barre de 1 a 20 A, así que el ancho del lazo se mide comparando las dos sobre la ventana de corriente que comparten.",
  rampLagNote:
    "¿Es el retardo del sensor? En parte, y se puede medir sin suponer ningún modelo — porque el registro de escalón es, literalmente, la respuesta de este sensor a un escalón. Superponiendo una copia suya por cada incremento de la corriente del barrido se obtiene lo que ese mismo sensor habría marcado: la predicción sigue a la fuerza medida con un r² de 0,997, así que es el mismo instrumento en los dos ensayos. Pero abre un lazo de apenas la mitad del ancho del real. El retardo explica cerca de la mitad de la histéresis y no más; el resto no es demora, porque corregir el desfase incluso agranda la diferencia entre ramas. Con estos datos no se puede separar si es rozamiento mecánico de la balanza o deriva del banco con 20 A circulando durante 20 s.",
  rampDelayNote:
    "De ahí sale también la respuesta a cuánto demora el sensor. El número que importa para una entrada lenta no es el tiempo de subida ni el de asentamiento, sino el retardo efectivo: el área entre la respuesta al escalón y su meseta, dividida por la meseta. Es el centroide de la respuesta, no hace falta ningún modelo para calcularlo, y da bastante menos que el tiempo de asentamiento porque casi todo el final del transitorio transcurre ya pegado al valor final. Ese es el desplazamiento que el escalón le pronostica a la fuerza en un barrido lento. El retardo aparente que sale de alinear F con I en la medición continua es más de un 50 % más largo, y ahora se entiende por qué: ese estimador le atribuye al retardo todo el ancho del lazo, incluida la mitad que no es retardo.",
  rampAxisI: "I (A)",
  rampAxisF: "F (mN)",
  rampRising: "Subida",
  rampFalling: "Bajada",
  rampOverallFit: "Ajuste total",
  rampRisingFit: "Ajuste subida",
  rampFallingFit: "Ajuste bajada",
  mPeak: "Corriente máxima",
  mRate: "Ritmo máximo de la perilla",
  mSlope: "Pendiente F/I",
  mR2: "r² del ajuste",
  mTare: "Tara residual",
  mFieldRamp: "B del ajuste total",
  mHysteresis: "Histéresis entre ramas",
  mLag: "Retardo aparente (alinea F con I)",
  mDelayStep: "Retardo efectivo (del escalón)",
  mLoop: "Ancho del lazo",
  mLoopExplained: "Del lazo explicado por el retardo",

  indirectTitle: "4. La medición indirecta por puntos",
  indirectBody:
    "Se realiza la medición indirecta aplicando literalmente el paso (d) de la guía: subir I en escalones de ~2 A y anotar un punto con F9 en cada uno, hasta el límite térmico de 20 A. La rendija donde se apoya el bucle es angosta y el bucle puede llegar a rozar el solenoide; el sensor de fuerza, además, es sensible a un golpe en la mesa. Por eso el ensayo se repitió en 4 sesiones independientes, reacomodando el bucle entre una y otra: es una forma de promediar ese ruido mecánico en vez de acotarlo con un margen de error fijo, que es lo que pide la fórmula de la guía cuando no hay forma de conocer de antemano cuánto puede rozar el bucle.",
  indirectOutlierNote:
    "El punto marcado en rojo (sesión B, I ≈ 20 A) es un candidato claro a descartar: la fuerza salta 0,67 mN en un paso de corriente donde el resto de los puntos —de esa sesión y de las otras tres— suben 0,2-0,3 mN. La guía preveía justamente esto con «Borrar última línea de tabla», pero acá quedó en el registro; se lo detecta ex post ajustando cada sesión con una recta robusta (Theil–Sen, que un solo punto malo no alcanza a desviar) y marcando lo que se aparta más de 4 desvíos absolutos medianos de esa recta. Excluirlo antes de promediar corrige el campo de esa sesión bastante más cerca de las otras tres.",
  indirectAxisI: "I (A)",
  indirectAxisF: "F (mN)",
  indirectOutlierLabel: "descartado",
  mSessions: "Sesiones",
  mIndirectPoints: "Puntos F9 totales",
  mIndirectOutliers: "Puntos descartados",
  mFieldIndirect: "B promedio (sesiones limpias)",
  mFieldSpread: "Dispersión entre sesiones",

  directTitle: "2. La medición directa con sonda",
  directBody:
    "Con esa primera pista cualitativa, se repite la comprobación con precisión: una sonda Hall entra por la misma rendija del solenoide y se la mueve a mano —al centro, a las puntas de la bobina y fuera de su núcleo— con la bobina a la misma corriente. La sonda sólo capta la componente del campo paralela a su propia punta, así que casi siempre se la mantuvo alineada con el eje del solenoide: lo que cambia entre punto y punto es sobre todo dónde está apoyada, salvo en las puntas, donde además se la dio vuelta, y en un punto donde en cambio se la giró transversal. Eso es justamente lo que se ve en los 14 puntos de esta medición directa.",
  directCompassNote:
    "Antes de la sonda Hall, con el solenoide energizado a 5,04 A ± 5 mA, una brújula común ya lo mostraba de forma cualitativa: acercada al solenoide, la aguja se alinea con el eje de la bobina. Es la primera confirmación, a ojo y sin ningún instrumento de precisión, de que el campo adentro es axial — lo mismo que la sonda termina midiendo con números.",
  compassDiagram: {
    coil: "Solenoide",
    compass: "Brújula",
    positionFar: "Lejos",
    positionMouth: "Frente a la boca",
    positionCenter: "En el medio del núcleo",
    positionSide: "Al costado",
    farHint:
      "Lejos, la aguja apunta según el campo terrestre — el solenoide no tiene efecto.",
    mouthHint:
      "Frente a la boca, sobre el eje, el campo de la bobina domina y la aguja se alinea con él, en el mismo sentido que adentro.",
    centerHint:
      "En el medio del núcleo la aguja se queda igual de alineada que en la boca — adentro de un solenoide largo el campo es prácticamente constante, no solo en la punta.",
    sideHint:
      "Al costado de la bobina, afuera, el campo vuelve por fuera para cerrar el circuito — como en un imán, ahí apunta al revés que adentro.",
    north: "N (campo terrestre)",
  },
  directOrthogonalNote:
    "Con la sonda centrada (n=8-11) la lectura se planta en 1,70 mT — el mismo valor que se usa como referencia en la sección 8. En las puntas de la bobina (n=1, 2, 7), dada vuelta 180° pero igual de alineada con el eje, el módulo cae a la mitad casi exacto (0,82 mT, razón 0,48) y el signo se invierte: es el efecto de borde de un solenoide finito, donde el campo axial en el extremo es aproximadamente la mitad del que hay en el centro. El resto de los puntos (n=3-6, 12-14) leen cerca de cero, pero no todos por la misma razón: la mayoría (n=4, 5, 12-14) porque la sonda —igual de paralela al eje— está apoyada fuera del núcleo de la bobina, donde simplemente no hay campo que leer, esté bien orientada o no. n=3 es la excepción: sigue en la punta, donde el campo sí es real, pero ahí la sonda se giró transversal (90° respecto del eje), así que no capta nada de lo que hay. n=6 es otra variante de «afuera»: no más allá de la punta, sino por debajo del bobinado.",
  directValidityNote:
    "Esta misma medición fue la que confirmó que el vector de campo es ortogonal a la espira — la condición que hace válida la expresión F = I·l·B en la que se apoyan las mediciones de fuerza que siguen.",
  directDiagram: {
    supply: "Fuente bobina",
    coil: "Solenoide",
    probe: "Sonda Hall",
    meter: "Teslámetro",
    fieldB: "B",
    positionCenter: "centro",
    positionEnd: "punta",
    positionOutside: "afuera del núcleo",
    positionTipTransversal: "punta, sonda transversal",
    play: "▶ Recorrer los 14 puntos",
    pause: "■ Detener",
    prev: "◀ Anterior",
    next: "Siguiente ▶",
    point: (n) => `${n} / 14`,
  },
  chartN: "n",
  markerEnd: "punta (invertida)",
  markerOutside: "afuera / fuera de eje",
  markerCenter: "centro",
  mCenterField: "B en el centro",
  mEndField: "B en la punta",
  mEndRatio: "Razón punta/centro",
  mOutsideField: "B fuera del núcleo",
  mCoilCurrent: "Corriente de bobina",

  fieldTitle: "8. De la fuerza al campo",
  fieldBody:
    "Aplicando B = F/(I·l) muestra a muestra se ve lo mismo desde el otro lado: mientras el sensor todavía se está acomodando, el «campo» calculado no significa nada; recién cuando la fuerza se asienta, el cociente se estabiliza en el valor real.",
  fieldCompare: (measured, direct, deltaPct) =>
    `El valor de régimen da B = ${measured} mT. La medición directa con la sonda de campo da ${direct} mT en su meseta: una diferencia del ${deltaPct} %, dentro de lo esperable para un método indirecto con un solo punto de corriente.`,

  fieldThree: (ramp, spreadPct) =>
    `Y la medición continua, con su ajuste sobre 201 puntos, da ${ramp} mT. Los tres caminos —la fuerza en régimen tras un escalón, la pendiente de un barrido continuo y la sonda de campo— caen dentro del ${spreadPct} % entre sí, que para un ensayo de banco es un acuerdo muy razonable.`,
  fieldFour: (indirect, spreadPct) =>
    `Y las 4 sesiones de la medición indirecta por puntos, promediadas tras descartar el punto que rozó, dan ${indirect} mT. Con esta cuarta vía sumada, los cuatro caminos siguen cayendo dentro del ${spreadPct} % entre sí — el método de punto por punto, con toda su repetición manual, resulta igual de preciso que el continuo o el de escalón.`,
  averageTitle: "Valor promedio del campo",
  fieldAverage: (avgMt, errorMt) =>
    `El valor promedio solicitado del campo magnético, combinando los cuatro caminos, es B = ${avgMt} ± ${errorMt} mT — con el error tomado como la dispersión entre los cuatro métodos, que domina ampliamente por sobre el error instrumental de cada uno por separado.`,
  mFieldAverage: "B promedio (4 métodos)",
  theoryTitle: "Comparación con el valor teórico",
  fieldTheory: (theoryMt, theoryErrorMt, deltaPct) =>
    `El campo magnético de un solenoide ideal, B = μ₀·n·I con n = N/L: con las 120 espiras y los 406 mm de longitud medidos a mano el día del ensayo, y la misma corriente de bobina (5,04 A), da B = ${theoryMt} ± ${theoryErrorMt} mT — un ${deltaPct} % por encima del promedio de las cuatro mediciones. La diferencia no es error experimental: la propagación de errores de N, L e I da un margen de apenas unas milésimas de mT. Es, en cambio, la fórmula ideal mostrando su límite — asume un solenoide infinitamente largo, y este mide 406 mm de largo por 120 mm de diámetro (L/D ≈ 3,4): corto y ancho, lejos de esa condición. El campo real en el centro de un solenoide así de corto queda por debajo del que predice μ₀·n·I, exactamente lo que se observa.`,
  fieldCalculatedVsDirect: (forcePct, theoryPct) =>
    `Comparando con la medición directa realizada con la sonda: el resultado por fuerza difiere un ${forcePct} %, y el teórico un ${theoryPct} % — la fórmula ideal se aleja más, otra vez por el efecto de borde del solenoide corto.`,
  mTheoryField: "B teórico (solenoide ideal)",
  mTheoryTurns: "N espiras",
  mTheoryLength: "Longitud del solenoide",
  mTheoryDelta: "Teórico vs. promedio medido",

  conclusionsTitle: "9. Conclusiones",
  conclusionsBody: [
    "Las cuatro vías para llegar a B —la fuerza en régimen tras un escalón, la pendiente de un barrido continuo, el promedio de 4 sesiones punto por punto, y la sonda Hall— concuerdan entre sí dentro de unos pocos puntos porcentuales, a pesar de partir de instrumentos y procedimientos completamente distintos.",
    "El valor medido resulta sistemáticamente más bajo que el que predice la fórmula ideal del solenoide (B = μ₀·n·I): la diferencia es consistente con el efecto de borde de un solenoide corto y ancho (L/D ≈ 3,4), no con error experimental — la fórmula ideal asume un solenoide mucho más largo que este.",
    "La medición directa confirmó dos supuestos de los que depende todo lo anterior: que el campo es axial (ortogonal a la espira, la condición que hace válida F = I·l·B) y que cae a aproximadamente la mitad en los extremos, tal como predice la teoría de un solenoide finito.",
    "El mayor desafío del ensayo estuvo en la mecánica del instrumental: la respuesta subamortiguada del sensor de fuerza exige tiempos de asentamiento de varios cientos de milisegundos entre punto y punto, y la rendija angosta del solenoide dejó al menos un roce accidental registrado como outlier en la medición indirecta.",
  ],

  bridgeTitle: "Relación con el simulador",
  bridgeBody:
    "Este laboratorio es la contraparte magnetostática del simulador electrostático de esta app, que resuelve la ecuación de Laplace por el método de Relax: allá se obtiene el potencial eléctrico V y el campo E = −∇V; acá el campo B se obtiene midiendo la fuerza sobre una corriente conocida. En los dos casos el paso interesante es el mismo: pasar de una magnitud medible a un campo que no se ve.",
};

const EN: Lab1Copy = {
  backToSim: "← Back to the simulator",
  title: "Lab 1 — Forces between currents and magnetic fields",
  subtitle:
    "How to read the solenoid experiment through its four measurements — direct probe, point-by-point indirect, continuous, and step — what each one measures, why CASSY is needed to pick up such small forces, and what field that current flow produces.",
  source:
    "Source: guide GL-950526-2 (Cátedra Teoría de los Campos, UTN.BA) and measurements recorded in the lab.",

  goalTitle: "1. What is measured, and why",
  goalBody:
    "An air-core solenoid driven at 5 A produces a uniform field B inside it. An 8.1 cm conductor loop carrying an adjustable current I (0 to 12 A) is lowered into that field. The Lorentz force on a straight segment perpendicular to the field is F = I·l·B, so measuring F and I is enough to solve for the field:",
  formula: "B = F / (I · l)",
  formulaNote:
    "with l = 8.1 cm, the loop length measured by hand (the guide gives a nominal 8 cm). The force sensor feeds CASSY input A (F_A1) and the loop current feeds input B (I_B1); both are logged simultaneously.",
  errorFormula: "ΔB = (F/I²l)·ΔI + (F/I l²)·Δl + (1/I l)·ΔF",
  errorNote:
    "The absolute error propagates as the sum of the partial derivatives of B with respect to I, l and F, evaluated at each measurement point. The result is reported as B ± ΔB.",

  setupTitle: "3. The bench",
  setupSteps: [
    "The force sensor holds the 8.1 cm conductor loop and lowers it between the solenoid windings without touching them.",
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
    "Schematic of the setup from figure 2.1 of the guide. The dashed strokes trace where each current flows: the solenoid's (fixed at 5 A) and the loop's (variable). Note the loop circuit: CASSY input B measures current, so it sits in series — in through one terminal and out through the other — and from there the current goes on to the loop and back to the supply. Drag the slider to see the force on the loop grow with current, or replay either of the two real captures to drive the animation from the data. The current-step capture is where the point lands: the current jumps at once while the loop arrives late, overshoots, and only then settles. The continuous measurement shows the other extreme: the knob turned by hand over 20 s, with the sensor tracking it closely.",
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
    playStep: "▶ Step",
    playRamp: "▶ Continuous",
    pause: "■ Stop",
    replayHint:
      "Replaying the real step on a loop. The interesting part lasts a few tenths of a second, so slow it down to watch it: the current is already up while the loop is still rising.",
    replayRampHint:
      "Replaying the continuous measurement on a loop: the 20 s of the knob turned by hand, up to 20 A and back. At this pace the sensor tracks the current closely — the lag is still there, but it takes the chart to see it.",
    manualHint:
      "Manual mode: force is computed as F = I · l · B with the measured field. The experiment's sweep runs 0 to 12 A in 2 A steps.",
    elapsed: "t",
  },

  stepTitle: "5. The current-step capture",
  stepBody:
    "This capture is not a field measurement: it is the bench's response to a current step. The current goes from ~1 A to 20.2 A in about 2 ms — a perfect step as far as the sensor is concerned — and everything the force curve does afterwards is the sensor's mechanical response, not field physics. Hover the chart to read values.",
  inrushNote:
    "So why is there no inrush peak? Because nothing in this circuit can produce one. Inrush appears when something momentarily draws far more current than it does in steady state: an iron core saturating as it is energised, or a discharged bulk capacitor. Here the load is the 8.1 cm loop and its leads — essentially resistive, with no core and no capacitance — and the coil, which is the inductive part, is air-core: an inductor without iron cannot saturate, so energising it grows exponentially towards its final value and never above it (and it is on the other circuit anyway, settled at 5 A well before this capture). On top of that the supply is an electronically regulated, current-limited source: its control loop drives the current to the setpoint and holds it there. The measurement agrees — a monotonic rise with τ ≈ 1 ms, 99 % of the final value by 4 ms, and a largest excursion of 0.6 % above steady state, within the channel's own noise (±0.1 A). That 1 ms is also far too slow for the loop's own inductance (of order 1 µH, which would settle in tens of microseconds), so what we see is the supply's loop rather than the load. On this bench the only thing that rings is the sensor's mechanics.",
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

  lessonTitle: "6. What the step tells you about how to measure",
  lessonBody: [
    "The current has already reached its final value while the force has not even started to move: the sensor only lifts off tens of milliseconds later, takes over 0.1 s to go from 10 % to 90 %, and overshoots before coming back.",
    "That overshoot and the ringing after it are the signature of an underdamped second-order system: the force balance is a spring with mass and friction, not an instantaneous instrument.",
    "Practical consequence: if during the 0-to-12 A sweep you hit F9 right after turning the knob, you are recording a point of the transient, not the steady value — the force ends up over- or underestimated depending on where in the ringing you land.",
    "This is the trade-off of the experiment: the guide asks you to work fast because the loop cannot hold 20 A for long, yet each point needs the settling time measured below. That is the number to respect between steps.",
  ],

  rampTitle: "7. The continuous measurement",
  rampBody:
    "A continuous measurement is taken, as requested by the report: F against I. Instead of stepping in 2 A increments, the knob is turned by hand continuously while CASSY logs on its own — 201 samples every 100 ms across 20 s. The current rises to a peak and then comes back down, so the record holds both branches of the sweep, and that is what turns the sensor's lag into something you can see at a glance.",
  rampTimeBody:
    "First the time record: you can see the hand's pace in the current, with the force tracking it closely because at this rate (≈1 A/s) the sensor has time to settle between samples.",
  rampHysteresis:
    "Plotting F against I brings out the detail: the way up and the way down do not overlap. The rising branch sits below the falling one, and each fits a different line. The field did not change: the loop the two branches enclose is literally the error you make depending on which way you are turning the knob. One caveat in reading it — the falling branch only covers 13 to 20 A while the rising one sweeps 1 to 20 A, so the loop width is measured by comparing the two over the current window they share.",
  rampLagNote:
    "Is it the sensor's lag? Partly — and it can be measured without assuming any model, because the step record is literally this sensor's response to a step. Superposing a copy of it for every increment of the sweep's current gives what that same sensor would have reported: the prediction tracks the measured force with an r² of 0.997, so it is the same instrument in both experiments. But it opens a loop only half as wide as the real one. The lag accounts for about half of the hysteresis and no more; the rest is not delay, since correcting the shift actually widens the gap between branches. These data cannot separate whether it is mechanical friction in the balance or drift of the bench with 20 A flowing for 20 s.",
  rampDelayNote:
    "That also answers how much the sensor delays. The number that matters for a slow input is neither the rise time nor the settling time, but the effective delay: the area between the step response and its plateau, divided by the plateau. It is the centroid of the response, it needs no model at all, and it comes out well under the settling time because the tail of the transient plays out right next to the final value. That is the shift the step record predicts for the force in a slow sweep. The apparent lag from aligning F with I in the continuous measurement comes out over 50 % longer, and now we know why: that estimator blames the delay for the entire loop, including the half that is not delay.",
  rampAxisI: "I (A)",
  rampAxisF: "F (mN)",
  rampRising: "Rising",
  rampFalling: "Falling",
  rampOverallFit: "Overall fit",
  rampRisingFit: "Rising fit",
  rampFallingFit: "Falling fit",
  mPeak: "Peak current",
  mRate: "Fastest knob rate",
  mSlope: "F/I slope",
  mR2: "Fit r²",
  mTare: "Residual tare",
  mFieldRamp: "B from the overall fit",
  mHysteresis: "Hysteresis between branches",
  mLag: "Apparent lag (aligning F with I)",
  mDelayStep: "Effective delay (from the step)",
  mLoop: "Loop width",
  mLoopExplained: "Of the loop explained by the lag",

  indirectTitle: "4. The point-by-point indirect measurement",
  indirectBody:
    "The indirect measurement is taken by literally applying guide step (d): raise I in ~2 A steps and log one point with F9 at each, up to the 20 A thermal limit. The slit the loop sits in is narrow enough that the loop can graze the solenoid, and the force sensor is also sensitive to a knock on the bench. So the run was repeated across 4 independent sessions, re-seating the loop each time: a way to average out that mechanical noise rather than bound it with a fixed error margin, which is what the guide's formula asks for when there is no way to know beforehand how much the loop might graze.",
  indirectOutlierNote:
    "The point marked in red (session B, I ≈ 20 A) is a clear candidate to drop: the force jumps 0.67 mN over a current step where every other point — in that session and the other three — climbs 0.2-0.3 mN. The guide anticipated exactly this with «Delete last table row», but here it stayed in the record; it shows up after the fact by fitting each session with a robust line (Theil–Sen, which a single bad point cannot itself drag off course) and flagging whatever sits more than 4 median absolute deviations from it. Dropping it before averaging pulls that session's field noticeably closer to the other three.",
  indirectAxisI: "I (A)",
  indirectAxisF: "F (mN)",
  indirectOutlierLabel: "dropped",
  mSessions: "Sessions",
  mIndirectPoints: "Total F9 points",
  mIndirectOutliers: "Points dropped",
  mFieldIndirect: "Mean B (clean sessions)",
  mFieldSpread: "Spread across sessions",

  directTitle: "2. The direct probe measurement",
  directBody:
    "With that first qualitative clue in hand, the check is repeated with precision: a Hall probe enters through the same solenoid slit and is moved by hand — to the centre, to the coil's ends, and outside its core — with the coil held at the same current. The probe only picks up the field component parallel to its own tip, so it was almost always kept aligned with the solenoid's axis: what changes from point to point is mostly where it sits, except at the ends, where it was also turned around, and one point where it was turned transversal instead. That is exactly what shows up across the 14 points of this direct measurement.",
  directCompassNote:
    "Before the Hall probe, with the solenoid energised at 5.04 A ± 5 mA, an ordinary compass already showed it qualitatively: held up to the solenoid, the needle lines up with the coil's axis. It's the first confirmation, by eye and with no precision instrument at all, that the field inside is axial — the same thing the probe goes on to measure in numbers.",
  compassDiagram: {
    coil: "Solenoid",
    compass: "Compass",
    positionFar: "Far away",
    positionMouth: "Facing the mouth",
    positionCenter: "In the middle of the core",
    positionSide: "Beside the coil",
    farHint:
      "Far away, the needle follows Earth's field — the solenoid has no effect.",
    mouthHint:
      "Facing the mouth, on axis, the coil's field wins and the needle lines up with it, the same direction as inside.",
    centerHint:
      "In the middle of the core the needle stays just as aligned as at the mouth — inside a long solenoid the field is nearly constant, not just near the tip.",
    sideHint:
      "Beside the coil, outside, the field loops back around to close the circuit — like a magnet, it points the opposite way there compared to inside.",
    north: "N (Earth's field)",
  },
  directOrthogonalNote:
    "With the probe centred (n=8-11) the reading settles at 1.70 mT — the same value used as the reference in section 8. At the coil's ends (n=1, 2, 7), flipped 180° but just as aligned with the axis, the magnitude drops to almost exactly half (0.82 mT, a ratio of 0.48) and the sign inverts: that is the end effect of a finite solenoid, where the axial field at the tip runs at roughly half the centre value. Every other point (n=3-6, 12-14) reads near zero, but not all for the same reason: most (n=4, 5, 12-14) have the probe just as parallel to the axis, but resting outside the coil's core, where there is no field to read, aligned or not. n=3 is the exception: still at the tip, where the field is real, but there the probe was turned transversal (90° off the axis), so it picks up none of what's actually there. n=6 is another flavour of outside: not past the tip, but beneath the winding.",
  directValidityNote:
    "This is also the capture that confirmed the field vector is orthogonal to the loop — the condition that the force measurements in the following sections rely on.",
  directDiagram: {
    supply: "Coil supply",
    coil: "Solenoid",
    probe: "Hall probe",
    meter: "Teslameter",
    fieldB: "B",
    positionCenter: "center",
    positionEnd: "end",
    positionOutside: "outside the core",
    positionTipTransversal: "tip, probe transversal",
    play: "▶ Step through the 14 points",
    pause: "■ Stop",
    prev: "◀ Previous",
    next: "Next ▶",
    point: (n) => `${n} / 14`,
  },
  chartN: "n",
  markerEnd: "end (flipped)",
  markerOutside: "outside / off-axis",
  markerCenter: "center",
  mCenterField: "B at centre",
  mEndField: "B at end",
  mEndRatio: "End/centre ratio",
  mOutsideField: "B outside the core",
  mCoilCurrent: "Coil current",

  fieldTitle: "8. From force to field",
  fieldBody:
    "Applying B = F/(I·l) sample by sample shows the same thing from the other side: while the sensor is still settling, the computed «field» means nothing; only once the force settles does the ratio stabilise at the real value.",
  fieldCompare: (measured, direct, deltaPct) =>
    `The steady-state value gives B = ${measured} mT. The direct field probe measurement reads ${direct} mT on its plateau: a ${deltaPct} % difference, well within what an indirect method at a single current point can be expected to give.`,

  fieldThree: (ramp, spreadPct) =>
    `And the continuous measurement, fitted over 201 points, gives ${ramp} mT. All three routes — the steady force after a step, the slope of a continuous sweep, and the field probe — land within ${spreadPct} % of each other, which for a bench experiment is very reasonable agreement.`,
  fieldFour: (indirect, spreadPct) =>
    `And the 4 sessions of the point-by-point indirect measurement, averaged after dropping the point that grazed, give ${indirect} mT. With this fourth route added, all four still land within ${spreadPct} % of each other — the point-by-point method, for all its manual repetition, turns out just as accurate as the continuous or step methods.`,
  averageTitle: "Average field value",
  fieldAverage: (avgMt, errorMt) =>
    `The requested average magnetic field, combining all four routes, is B = ${avgMt} ± ${errorMt} mT — with the error taken as the spread between the four methods, which dwarfs each one's own instrument error.`,
  mFieldAverage: "B average (4 methods)",
  theoryTitle: "Comparison with the theoretical value",
  fieldTheory: (theoryMt, theoryErrorMt, deltaPct) =>
    `The magnetic field of an ideal solenoid, B = μ₀·n·I with n = N/L: with the 120 turns and 406 mm length measured by hand on the day of the practice, and the same coil current (5.04 A), this gives B = ${theoryMt} ± ${theoryErrorMt} mT — ${deltaPct} % above the average of the four measurements. The difference is not experimental error: propagating the errors on N, L and I gives a margin of only a few thousandths of a mT. It is instead the ideal formula showing its limit — it assumes an infinitely long solenoid, and this one measures 406 mm long by 120 mm across (L/D ≈ 3.4): short and wide, far from that condition. The real centre field of a solenoid this short sits below what μ₀·n·I predicts, exactly what is observed.`,
  fieldCalculatedVsDirect: (forcePct, theoryPct) =>
    `Comparing against the direct measurement taken with the probe: the force result differs by ${forcePct} %, and the theoretical one by ${theoryPct} % — the ideal formula misses by more, again because of the short solenoid's end effect.`,
  mTheoryField: "B theoretical (ideal solenoid)",
  mTheoryTurns: "N turns",
  mTheoryLength: "Solenoid length",
  mTheoryDelta: "Theoretical vs. measured average",

  conclusionsTitle: "9. Conclusions",
  conclusionsBody: [
    "The four routes to B — the steady force after a step, the slope of a continuous sweep, the average of 4 point-by-point sessions, and the Hall probe — agree with each other within a few percentage points, despite starting from completely different instruments and procedures.",
    "The measured value is systematically lower than what the ideal solenoid formula (B = μ₀·n·I) predicts: the difference is consistent with the end effect of a short, wide solenoid (L/D ≈ 3.4), not with experimental error — the ideal formula assumes a solenoid much longer than this one.",
    "The direct measurement confirmed two assumptions everything else depends on: that the field is axial (orthogonal to the loop, the condition that makes F = I·l·B valid) and that it drops to roughly half at the ends, exactly as finite-solenoid theory predicts.",
    "The experiment's biggest challenge was the mechanics of the instruments: the force sensor's underdamped response demands settling times of several hundred milliseconds between points, and the solenoid's narrow slit left at least one accidental graze on record as an outlier in the indirect measurement.",
  ],

  bridgeTitle: "How this relates to the simulator",
  bridgeBody:
    "This lab is the magnetostatic counterpart of this app's electrostatic Relax-method simulator: there, Laplace's equation is solved by relaxation to get the electric potential V and the field E = −∇V; here, B is obtained by measuring the force on a known current. In both cases the interesting step is the same — going from a measurable quantity to a field you cannot see.",
};

export const LAB1_COPY: Record<Language, Lab1Copy> = { es: ES, en: EN };
