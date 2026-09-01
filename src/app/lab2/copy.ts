import type { Lab2CircuitLabels } from "@/components/Lab2CircuitDiagram";
import type { Lab2DiagramLabels } from "@/components/Lab2Diagram";
import type { Lab2ErrorChartLabels } from "@/components/Lab2ErrorChart";
import type { Language } from "@/contexts/LanguageContext";

/**
 * Copy for the Laboratorio 2 page. Same arrangement as lab 1's: long-form
 * prose for a single route lives next to that route rather than in
 * LanguageContext's global key table, which is for the simulator chrome.
 */
export interface Lab2Copy {
  backToSim: string;
  backToLab1: string;
  title: string;
  subtitle: string;
  source: string;

  goalTitle: string;
  goalBody: string;
  formula: string;
  formulaInverted: string;
  formulaNote: string;
  errorFormula: string;
  errorFormulaRelative: string;
  errorNote: string;

  setupTitle: string;
  setupSteps: string[];
  setupWarning: string;

  geometryTitle: string;
  geometryBody: string;
  geometryTableCaption: string;
  geometryColQuantity: string;
  geometryColValue: string;
  geometryColHow: string;
  geometryRows: { quantity: string; how: string }[];
  geometryDiagramBody: string;
  geometryDiagramNote: string;
  diagram: Lab2DiagramLabels;

  circuitTitle: string;
  circuitBody: string;
  circuitNote: string;
  circuit: Lab2CircuitLabels;

  stepTitle: string;
  stepBody: string;
  stepReadNote: string;
  markersToggle: string;
  chartTime: string;
  chartForce: string;
  chartCurrent: string;
  hoverHint: string;
  bandLabel: string;
  markerCurrent: string;
  markerT10: string;
  markerT90: string;
  markerPeak: string;
  markerSettle: string;
  stepMetricsTitle: string;
  mForceSteady: string;
  mCurrentSteady: string;
  mCurrentSettled: string;
  mRise: string;
  mOvershoot: string;
  mSettle: string;
  mZeta: string;
  mNatFreq: string;

  curvesTitle: string;
  curvesBody: string;
  curvesSameRNote: string;
  linearizeToggle: string;
  curvesAxisI: string;
  curvesAxisI2: string;
  curvesAxisF: string;
  curvesTableCaption: string;
  colRun: string;
  colPoints: string;
  colSlope: string;
  colIntercept: string;
  colR2: string;
  colMu0Ideal: string;
  colMu0Corrected: string;
  curvesLinearityNote: (r2: string) => string;
  curvesSpreadNote: (spreadPct: string) => string;

  rampTitle: string;
  rampBody: string;
  rampHysteresisNote: (hysteresisPct: string) => string;
  rampAxisI2: string;
  rampAxisF: string;
  rampRising: string;
  rampFalling: string;
  rampOverallFit: string;
  rampRisingFit: string;
  rampFallingFit: string;
  mRampPeak: string;
  mRampSlope: string;
  mRampR2: string;
  mRampGap: string;
  mRampHysteresis: string;

  resultTitle: string;
  resultBody: string;
  resultTableCaption: string;
  colRoute: string;
  colDelta: string;
  routeCurves: string;
  routeRamp: string;
  routeStep: string;
  resultIdealNote: (mu0: string, deltaPct: string) => string;
  resultCorrectedNote: (mu0: string, deltaPct: string) => string;
  resultFinal: (mu0: string, errorPct: string, deltaPct: string) => string;
  mMu0Final: string;
  mMu0Error: string;
  mMu0Delta: string;
  mMu0Accepted: string;

  errorTitle: string;
  errorBody: string;
  errorAnswer: (
    dominantAtMax: string,
    sharePct: string,
    crossoverA: string,
  ) => string;
  errorPractical: string;
  errorChart: Lab2ErrorChartLabels;

  noteTitle: string;
  noteBody: string;
  noteAnswer: (shortfallPct: string, budgetPct: string) => string;
  noteImplied: (impliedMm: string, measuredMm: string) => string;

  conclusionsTitle: string;
  conclusionsBody: string[];

  bridgeTitle: string;
  bridgeBody: string;
}

const ES: Lab2Copy = {
  backToSim: "← Volver al simulador de campo eléctrico",
  backToLab1: "← Laboratorio 1 — Fuerzas entre corrientes y campos magnéticos",
  title: "Laboratorio 2 — Medición de la permeabilidad del vacío",
  subtitle:
    "Se mide la fuerza entre dos conductores rectos y paralelos recorridos por la misma corriente, y de ahí se despeja μ₀. Los datos son los del CASSY: tres curvas F(I) por escalones, un barrido continuo de ida y vuelta, y un registro de escalón a 1 ms.",
  source:
    "Guía GL-950526-3 · Cátedra Teoría de los Campos · UTN.BA · datos de lab2.xlsx",

  goalTitle: "1. Objetivo y expresiones",
  goalBody:
    "Para dos conductores rectos, infinitamente largos, separados una distancia r y recorridos por la misma corriente I en el mismo sentido, la fuerza sobre un tramo de longitud l vale:",
  formula: "F = μ₀ I² l / (2π r)",
  formulaInverted: "μ₀ = 2π F r / (I² l)",
  formulaNote:
    "Se miden I, l, F y r, y se despeja μ₀. Lo que se mide punto a punto no es un μ₀ por punto sino la forma de la curva: si la teoría vale, F contra I² tiene que dar una recta por el origen, y su pendiente a = μ₀ l /(2π r) es la que lleva toda la información. Ajustar la pendiente en vez de promediar valores sueltos es lo que hace que el ruido del sensor se promedie en lugar de propagarse.",
  errorFormula:
    "Δμ₀ = 4πFr/(I³l)·ΔI + 2πFr/(I²l²)·Δl + 2πr/(I²l)·ΔF + 2πF/(I²l)·Δr",
  errorFormulaRelative: "Δμ₀/μ₀ = 2·ΔI/I + Δl/l + ΔF/F + Δr/r",
  errorNote:
    "La expresión de la guía (§2.2) es una suma de derivadas parciales en valor absoluto — el caso más pesimista, no una suma en cuadratura. Dividiéndola por μ₀ queda mucho más legible: cada término es un error relativo, y la pregunta «cuál mete más error» se vuelve «cuál de las cuatro magnitudes está peor conocida en términos relativos». La corriente entra con factor 2 porque aparece al cuadrado. La respuesta está en la sección 9, y no es la misma en todo el rango de corriente.",

  setupTitle: "2. Montaje y procedimiento",
  setupSteps: [
    "El sensor de fuerzas sostiene el bucle conductor superior; el bucle inferior va sobre el soporte de altura ajustable. Ambos se conectan en serie, así que por los dos circula la misma corriente I.",
    "El sensor de fuerza va a la entrada A del Sensor-CASSY por la unidad Puente; la corriente pasa por la unidad de 30 A hacia la entrada B.",
    "Se acercan los dos bucles hasta que apenas se tocan — ahí la distancia entre centros es un diámetro, r ≈ 2 mm — y se corrige el paralelismo con el tornillo de ajuste.",
    "Se pone en cero el sensor (→0← en Ajustes Fuerza FA1) y se corrige el offset de corriente en Ajustes Corriente IB1.",
    "Se sube I de 0 a 20 A en pasos de ~2 A registrando un punto con F9 en cada paso, y se vuelve a 0 A al terminar.",
    "Se repite el barrido adjuntando una nueva serie de medición.",
  ],
  setupWarning:
    "El bucle conductor y su soporte sólo aguantan 20 A por poco tiempo: el ensayo se hace rápido y se vuelve a 0 A apenas termina cada serie. Ese apuro es exactamente lo que entra en conflicto con el tiempo de asentamiento del sensor que se mide en la sección 5.",

  geometryTitle: "3. Lo que se midió del banco",
  geometryBody:
    "El resultado depende de la geometría tanto como de lo que registra el CASSY, así que las cotas se levantaron a mano el día de la práctica. Las longitudes con regla, los diámetros de alambre con micrómetro y las separaciones con calibre.",
  geometryTableCaption: "Tabla 3.1. Cotas del banco.",
  geometryColQuantity: "Magnitud",
  geometryColValue: "Valor",
  geometryColHow: "Cómo se obtuvo",
  geometryRows: [
    {
      quantity: "Longitud del conductor I (inferior)",
      how: "Regla. Es el más largo: sostiene la hipótesis de «infinitamente largo» sobre el tramo que interesa.",
    },
    {
      quantity: "Longitud del conductor II (con sensor)",
      how: "Regla. Es la l de la fórmula: la fuerza se mide sobre este conductor, no sobre el otro.",
    },
    {
      quantity: "Diámetro del conductor I",
      how: "Micrómetro.",
    },
    {
      quantity: "Diámetro del conductor II",
      how: "Micrómetro.",
    },
    {
      quantity: "Separación r (centro a centro)",
      how: "1 mm de luz entre superficies, medido con calibre después de partir del contacto, más un diámetro medio.",
    },
    {
      quantity: "Altura h₁ del bucle suspendido",
      how: "Calibre, 60,1 mm por fuera; menos un diámetro para pasar a centro a centro.",
    },
    {
      quantity: "Altura h₂ del bucle del soporte",
      how: "Calibre, 18,3 mm de luz; más un diámetro para pasar a centro a centro.",
    },
  ],
  geometryDiagramBody:
    "Y acá aparece la discrepancia que gobierna todo el ensayo. La guía modela dos alambres solos e infinitos, pero en el banco cada conductor es el lado de un bucle cerrado, y el lado de vuelta de cada bucle lleva la misma corriente en sentido contrario. Son cuatro alambres, no dos, y de los cuatro pares que forman, tres empujan al revés del que la guía cuenta.",
  geometryDiagramNote:
    "El dibujo está en corte, mirando los conductores de punta: ⊙ es corriente saliendo del papel y ⊗ entrando. La escala vertical está deformada a propósito — r son 3 mm y las alturas de los bucles 20 y 58 mm, así que a escala real los conductores de vuelta quedarían fuera de la hoja y se perdería justamente lo que hay que ver. La cuenta es directa: en vez de 1/r la fuerza va con 1/r − 1/(r+h₂) − 1/(r+h₁) + 1/(r+h₁+h₂), y el porcentaje de abajo dice cuánto de la fuerza ideal sobrevive.",
  diagram: {
    activeWire: "conductor pesado",
    returnWire: "vuelta del bucle",
    upperHeight: "h₁",
    lowerHeight: "h₂",
    attract: "atracción (corrientes paralelas)",
    repel: "repulsión (corrientes antiparalelas)",
    idealCaption: "Lo que modela la guía: dos alambres infinitos",
    realCaption: "Lo que hay en el banco: dos bucles cerrados",
    survives: "Fuerza que sobrevive",
  },

  circuitTitle: "4. El banco, en movimiento",
  circuitBody:
    "Esquema del montaje de la figura 2.1 de la guía, con la corriente circulando. El detalle que importa es que hay un solo circuito: la fuente de 20 A alimenta la unidad de 30 A, que entra por el canal B del CASSY —en serie, porque B mide corriente— y de ahí pasa por los dos bucles, uno atrás del otro, antes de volver a la fuente. Por eso la misma I aparece dos veces en F = μ₀I²l/2πr: no son dos corrientes independientes sino la misma dando una vuelta. Ese es también el motivo de que la fuerza vaya con el cuadrado y no lineal.",
  circuitNote:
    "Los cuatro conductores horizontales están en el mismo orden que en el corte de la sección 3, y los pulsos van en el sentido real de la corriente: los dos conductores enfrentados van para el mismo lado —por eso se atraen— y la vuelta de cada bucle va para el otro, que es la que resta. Mueva el slider para ver F crecer con el cuadrado de I, o apriete ▶ Escalón para que el banco siga la captura real: ahí se ve que la corriente ya llegó y la fuerza todavía está subiendo, se pasa de largo y recién después se acomoda. Baje la velocidad a 0,1× para alcanzar a verlo. La flecha, la barra de carga del sensor y el readout salen de las muestras registradas, no de la fórmula. Los bucles se dibujan quietos a propósito: r se fija con el tornillo de altura y no se mueve durante la medición.",
  circuit: {
    supply: "Fuente 20 A",
    unit30: "Unidad 30 A",
    cassy: "Sensor-CASSY",
    bridge: "Unidad Puente",
    forceSensor: "Sensor de fuerza",
    supportTop: "Estructura soporte",
    supportBottom: "Ajuste de altura",
    upperLoop: "Bucle suspendido",
    lowerLoop: "Bucle del soporte",
    current: "I",
    forceF: "F",
    separation: "r",
    upperHeight: "h₁",
    lowerHeight: "h₂",
    speed: "Velocidad",
    playStep: "▶ Escalón",
    playRamp: "▶ Barrido continuo",
    pause: "■ Detener",
    replayStepHint:
      "Reproduciendo el escalón real en bucle. La corriente llega a 20 A en unos 7 ms y la fuerza tarda más de veinte veces eso en asentarse: bájelo a 0,25× o 0,1× para ver el sobrepico y la vuelta.",
    replayRampHint:
      "Reproduciendo el barrido continuo. La hoja no tiene columna de tiempo, así que se recorre muestra por muestra a un ritmo nominal y el contador cuenta muestras, no segundos.",
    manualHint:
      "Mueva el slider para recorrer el rango de 0 a 20 A. En este modo la fuerza sale de la pendiente ajustada, F = a·I², así que crece con el cuadrado: al doble de corriente, cuatro veces la fuerza.",
    elapsed: "t",
    sample: "n",
    load: "Carga del sensor",
  },

  stepTitle: "5. El escalón: cuánto hay que esperar cada punto",
  stepBody:
    "Antes de creerle a ningún punto conviene saber cuánto tarda el sensor. Este registro son 1001 muestras a 1 ms mientras se conmuta la corriente directo a 20 A y se deja que la fuerza siga sola. La corriente llega a su meseta casi de inmediato, así que todo lo que hace la fuerza después es mecánica del sensor y no física del campo.",
  stepReadNote:
    "La balanza de fuerzas es un resorte con masa y rozamiento: se pasa de largo y vuelve. Si se aprieta F9 antes de tiempo, el punto que queda registrado es un punto del transitorio y no el de régimen — sobreestimado si cae en el sobrepico, subestimado si cae antes. Ese es el compromiso concreto del ensayo: la guía pide hacerlo rápido porque el bucle no aguanta 20 A, pero cada escalón necesita el tiempo de asentamiento que se lee acá abajo.",
  markersToggle: "Marcar los tiempos característicos",
  chartTime: "t (s)",
  chartForce: "F (mN)",
  chartCurrent: "I (A)",
  hoverHint: "Deslice el cursor sobre el gráfico para leer un instante.",
  bandLabel: "±2 % de F final",
  markerCurrent: "I en meseta",
  markerT10: "10 %",
  markerT90: "90 %",
  markerPeak: "pico",
  markerSettle: "asentado ±2 %",
  stepMetricsTitle: "Figuras de mérito del escalón",
  mForceSteady: "F de régimen",
  mCurrentSteady: "I de régimen",
  mCurrentSettled: "I al 99 % de su meseta",
  mRise: "Tiempo de subida (10→90 %)",
  mOvershoot: "Sobrepico",
  mSettle: "Tiempo de asentamiento (±2 %)",
  mZeta: "Amortiguamiento ζ equivalente",
  mNatFreq: "Frecuencia natural f_n",

  curvesTitle: "6. Las tres curvas F(I)",
  curvesBody:
    "Las tres series de escalones que pide el paso (c) de la guía, superpuestas. El interruptor cambia el eje horizontal entre I e I²: en I la curva es la parábola que predice la teoría; en I² tiene que ser una recta, y en una recta el ojo detecta una curvatura residual que sobre una parábola jamás vería. Esa es la verificación de que F ∝ I², no un adorno.",
  curvesSameRNote:
    "Una aclaración honesta: el paso (f) pide repetir el barrido a distintas distancias r, y eso no se hizo — las tres series tienen la misma pendiente dentro del 1 %, así que fueron tomadas a la misma separación. Con estos datos no se puede mostrar la dependencia F ∝ 1/r. Lo que sí miden las repeticiones es la repetibilidad del montaje, y ese número resulta ser chico comparado con el error sistemático de la sección 10 — lo cual es, en sí mismo, un resultado.",
  linearizeToggle: "Linealizar: F contra I²",
  curvesAxisI: "I (A)",
  curvesAxisI2: "I² (A²)",
  curvesAxisF: "F (mN)",
  curvesTableCaption: "Tabla 5.1. Ajuste F = a·I² + b de cada serie.",
  colRun: "Serie",
  colPoints: "Puntos",
  colSlope: "a (mN/A²)",
  colIntercept: "b (mN)",
  colR2: "r²",
  colMu0Ideal: "μ₀ ideal (H/m)",
  colMu0Corrected: "μ₀ corregido (H/m)",
  curvesLinearityNote: (r2) =>
    `La linealidad es excelente: el peor r² de las tres series es ${r2}. La dependencia cuadrática con la corriente queda verificada sin margen de duda — el problema del ensayo no está acá.`,
  curvesSpreadNote: (spreadPct) =>
    `Las tres pendientes se separan apenas ${spreadPct} % entre la mayor y la menor. El montaje es repetible; lo que falla es el modelo con el que se lo interpreta.`,

  rampTitle: "7. El barrido continuo",
  rampBody:
    "El mismo ensayo pero sin esperar: 314 muestras tomadas mientras se mueve la perilla de 3 A hasta 20 A y se vuelve enseguida. Graficado contra I² el ajuste sigue siendo una recta, y las dos ramas —ida y vuelta— deberían superponerse. No lo hacen del todo, y el lazo que encierran es el retardo del sensor dibujado sobre el plano F-I.",
  rampHysteresisNote: (hysteresisPct) =>
    `El lazo mide ${hysteresisPct} % de la fuerza en el punto de retorno. Es chico — mucho más chico que la histéresis del barrido de Laboratorio 1 — porque acá la perilla se movió despacio en relación con el asentamiento del sensor. Es la confirmación directa de que las series por escalones, que además esperan en cada punto, no arrastran este error.`,
  rampAxisI2: "I² (A²)",
  rampAxisF: "F (mN)",
  rampRising: "Subida",
  rampFalling: "Bajada",
  rampOverallFit: "Ajuste total",
  rampRisingFit: "Ajuste subida",
  rampFallingFit: "Ajuste bajada",
  mRampPeak: "Corriente de retorno",
  mRampSlope: "Pendiente a del ajuste total",
  mRampR2: "r² del ajuste total",
  mRampGap: "Ancho medio del lazo",
  mRampHysteresis: "Histéresis relativa",

  resultTitle: "8. El valor de μ₀",
  resultBody:
    "Tres caminos independientes a la misma pendiente: las series por escalones, el barrido continuo y la meseta del escalón. Cada uno se convierte en μ₀ dos veces — con el modelo ideal de la guía y con los cuatro conductores reales.",
  resultTableCaption: "Tabla 7.1. μ₀ por cada camino, con y sin corrección.",
  colRoute: "Camino",
  colDelta: "Δ respecto del aceptado",
  routeCurves: "Series por escalones (promedio)",
  routeRamp: "Barrido continuo",
  routeStep: "Meseta del escalón",
  resultIdealNote: (mu0, deltaPct) =>
    `Con la fórmula tal cual la escribe la guía, μ₀ = ${mu0} H/m: ${deltaPct} % por debajo del valor aceptado. La dispersión entre los tres caminos es de menos del 1 %, así que no es ruido: los tres se equivocan junto, y hacia el mismo lado. Un desvío sistemático de ese tamaño, con datos tan limpios, apunta al modelo y no a la medición.`,
  resultCorrectedNote: (mu0, deltaPct) =>
    `Reemplazando 1/r por la suma sobre los cuatro conductores, el mismo dato da μ₀ = ${mu0} H/m, a ${deltaPct} % del valor aceptado. La corrección no se ajustó a nada — sale de dos cotas medidas con calibre — y sin embargo se come casi todo el desvío. Esa es la evidencia de que el problema era el modelo.`,
  resultFinal: (mu0, errorPct, deltaPct) =>
    `Resultado reportado: μ₀ = ${mu0} H/m ± ${errorPct} % (error de la guía §2.2 evaluado en el punto más fuerte de la curva). El valor aceptado queda a ${deltaPct} % — dentro del intervalo de error.`,
  mMu0Final: "μ₀ medido (corregido)",
  mMu0Error: "Δμ₀/μ₀ (§2.2)",
  mMu0Delta: "Δ respecto del aceptado",
  mMu0Accepted: "μ₀ aceptado",

  errorTitle: "9. ¿Cuál de los términos mete más error?",
  errorBody:
    "La pregunta se responde recorriendo la curva, no en un punto. Las bandas apiladas son la parte de Δμ₀ que aporta cada término; la línea sobre el eje derecho es el error relativo total. Tres de los cuatro términos —ΔI/I, ΔF/F y Δl/l— dependen del punto de trabajo, y dos de ellos se achican al subir la corriente. Δr/r no se mueve: es el mismo 3 % en todo el rango, porque r no cambia cuando cambia I.",
  errorAnswer: (dominantAtMax, sharePct, crossoverA) =>
    `A corriente alta el término dominante es ${dominantAtMax}, con el ${sharePct} % de Δμ₀. El cruce está cerca de los ${crossoverA} A: por debajo manda ΔF/F, porque la fuerza es de décimas de mN y el error del sensor es fijo; por encima manda Δr/r, que no mejora por más corriente que se le ponga. La longitud es siempre el término más chico — 1 mm sobre 302 mm es despreciable frente a todo lo demás.`,
  errorPractical:
    "La consecuencia práctica es doble. Primero: los puntos de corriente baja casi no aportan información y conviene que el ajuste no los deje pesar como los demás. Segundo, y más importante: una vez arriba de los 10 A el ensayo está limitado por una cota de calibre de un décimo de milímetro sobre una separación de 3 mm. Para mejorar este resultado no hace falta un sensor mejor ni una fuente más estable — hace falta medir r mejor, o separar más los conductores y aceptar una fuerza más chica.",
  errorChart: {
    xAxis: "I (A)",
    shareAxis: "Aporte a Δμ₀ (%)",
    totalAxis: "Δμ₀/μ₀ (%)",
    current: "ΔI/I",
    length: "Δl/l",
    force: "ΔF/F",
    separation: "Δr/r",
    total: "total",
    hoverHint:
      "Deslice el cursor sobre el gráfico para leer el reparto a una corriente dada.",
  },

  noteTitle: "10. La Nota de la guía: el conductor superior del bucle",
  noteBody:
    "La guía cierra pidiendo evaluar si el error sistemático que introduce el conductor superior del bucle se puede despreciar o no, teniendo en cuenta el error absoluto de la medición. Es la pregunta central del informe y con los números de arriba se contesta sin ambigüedad.",
  noteAnswer: (shortfallPct, budgetPct) =>
    `No se puede despreciar. Los conductores de vuelta cancelan el ${shortfallPct} % de la fuerza que daría el par ideal, mientras que el error absoluto de la medición en el mejor punto es del ${budgetPct} %. El efecto sistemático es del orden de tres veces el error de medición completo: está muy por fuera de la barra de error, no adentro. Despreciarlo es exactamente lo que produce el desvío del 17 % de la sección 8.`,
  noteImplied: (impliedMm, measuredMm) =>
    `Otra forma de verlo, sin hablar de μ₀. Si se toma μ₀ como conocido y se le pide a la fórmula ideal que devuelva la separación, pide r = ${impliedMm} mm — cuando el calibre midió ${measuredMm} mm. El modelo de dos alambres necesita los conductores un 20 % más lejos de lo que estaban, y esa distancia de más es precisamente la que representa la fuerza que los conductores de vuelta restan.`,

  conclusionsTitle: "Conclusiones",
  conclusionsBody: [
    "La dependencia F ∝ I² queda verificada con r² mejor que 0,999 en las tres series. La expresión teórica de la guía describe bien la forma de la curva.",
    "El montaje es repetible: las tres series coinciden dentro del 1 % y el barrido continuo, tomado de otra manera, cae en el mismo lugar.",
    "Aplicada literalmente, la fórmula de la guía da μ₀ un 17 % por debajo del valor aceptado, y los tres caminos independientes se equivocan igual. Un desvío sistemático con datos limpios es un problema de modelo, no de medición.",
    "El modelo que falta es el que la propia guía sugiere en su Nota: los conductores no son alambres sueltos sino lados de bucles cerrados, y los tres pares extra cancelan un 14 % de la fuerza. Corrigiendo eso —sin ajustar ningún parámetro, sólo con dos cotas de calibre— μ₀ queda a menos del 4 % del valor aceptado, dentro del error de medición.",
    "Del análisis de errores: a corriente alta el término dominante es Δr/r, y por un margen amplio. r es la magnitud más chica que se mide en todo el ensayo y la que peor se conoce en términos relativos. A corriente baja domina ΔF/F simplemente porque la fuerza tiende a cero mientras el error del sensor no.",
    "El único cambio que mejoraría sustancialmente este ensayo es medir mejor la separación entre conductores. Un sensor de fuerza más fino o una fuente más estable no moverían el resultado.",
    "Lo que quedó sin hacer: el paso (f) pide curvas a distintas r, y las tres series se tomaron a la misma separación. Habría sido la comprobación directa de F ∝ 1/r y, de paso, la forma más limpia de exhibir la corrección de los bucles, que depende de r de manera distinta que el término ideal.",
  ],

  bridgeTitle: "De la magnetostática al simulador",
  bridgeBody:
    "Este ensayo y el anterior recorren la magnetostática desde la fuerza: de la corriente al campo, y del campo a la constante que los vincula. El simulador de este sitio va por el otro lado del programa — el campo electrostático resuelto numéricamente con el método de relajación — pero comparte la misma idea de fondo: una ecuación diferencial que sólo se deja ver cuando se la mide o se la itera.",
};

const EN: Lab2Copy = {
  backToSim: "← Back to the electric field simulator",
  backToLab1: "← Lab 1 — Forces between currents and magnetic fields",
  title: "Lab 2 — Measuring the permeability of free space",
  subtitle:
    "The force between two straight parallel conductors carrying the same current, turned into μ₀. The data is the CASSY record: three stepped F(I) runs, one continuous up-and-down sweep, and a 1 ms step capture.",
  source:
    "Guide GL-950526-3 · Teoría de los Campos · UTN.BA · data from lab2.xlsx",

  goalTitle: "1. Goal and expressions",
  goalBody:
    "For two straight, infinitely long conductors a distance r apart carrying the same current I in the same direction, the force on a length l of one of them is:",
  formula: "F = μ₀ I² l / (2π r)",
  formulaInverted: "μ₀ = 2π F r / (I² l)",
  formulaNote:
    "Measure I, l, F and r, and solve for μ₀. What each point measures is not a μ₀ of its own but the shape of the curve: if the theory holds, F against I² is a straight line through the origin, and its slope a = μ₀ l /(2π r) carries all the information. Fitting the slope instead of averaging isolated values is what makes the sensor noise average out rather than propagate.",
  errorFormula:
    "Δμ₀ = 4πFr/(I³l)·ΔI + 2πFr/(I²l²)·Δl + 2πr/(I²l)·ΔF + 2πF/(I²l)·Δr",
  errorFormulaRelative: "Δμ₀/μ₀ = 2·ΔI/I + Δl/l + ΔF/F + Δr/r",
  errorNote:
    'The guide\'s expression (§2.2) is a sum of absolute partials — the worst case, not a sum in quadrature. Dividing it by μ₀ makes it far easier to read: every term becomes a relative error, and "which one hurts most" becomes "which of the four quantities is known worst, relatively". The current enters with a factor of 2 because it appears squared. Section 9 answers it, and the answer is not the same across the current range.',

  setupTitle: "2. Setup and procedure",
  setupSteps: [
    "The force sensor holds the upper conductor loop; the lower loop sits on the height-adjustable holder. They are wired in series, so the same current I runs through both.",
    "The force sensor goes to Sensor-CASSY input A through the Bridge unit; the current goes through the 30 A unit into input B.",
    "Bring the loops together until they just touch — centre-to-centre distance is one diameter there, r ≈ 2 mm — and correct the parallelism with the adjusting screw.",
    "Zero the sensor (→0← under Force FA1 settings) and correct the current offset under Current IB1 settings.",
    "Raise I from 0 to 20 A in ~2 A steps, logging one point with F9 at each step, and return to 0 A at the end.",
    "Repeat the sweep by appending a new measurement series.",
  ],
  setupWarning:
    "The conductor loop and its holder only take 20 A for a short time: the run has to be quick and the current back to 0 A as soon as each series ends. That hurry is exactly what conflicts with the sensor's settling time measured in section 5.",

  geometryTitle: "3. What was measured on the bench",
  geometryBody:
    "The result depends on the geometry as much as on what the CASSY records, so the dimensions were taken by hand on the day of the practice: lengths with a rule, wire diameters with a micrometer, separations with a caliper.",
  geometryTableCaption: "Table 3.1. Bench dimensions.",
  geometryColQuantity: "Quantity",
  geometryColValue: "Value",
  geometryColHow: "How it was obtained",
  geometryRows: [
    {
      quantity: "Length of conductor I (lower)",
      how: 'Rule. It is the longer one: it is what makes the "infinitely long" assumption defensible over the span that matters.',
    },
    {
      quantity: "Length of conductor II (with sensor)",
      how: "Rule. This is the l of the formula: the force is measured on this conductor, not the other one.",
    },
    { quantity: "Diameter of conductor I", how: "Micrometer." },
    { quantity: "Diameter of conductor II", how: "Micrometer." },
    {
      quantity: "Separation r (centre to centre)",
      how: "1 mm of clear gap between surfaces, read on the caliper after starting from contact, plus one mean diameter.",
    },
    {
      quantity: "Height h₁ of the suspended loop",
      how: "Caliper, 60.1 mm outside to outside; minus one diameter to get centre to centre.",
    },
    {
      quantity: "Height h₂ of the holder loop",
      how: "Caliper, 18.3 mm of clear gap; plus one diameter to get centre to centre.",
    },
  ],
  geometryDiagramBody:
    "And here is the discrepancy that governs the whole experiment. The guide models two lone infinite wires, but on the bench each conductor is the side of a closed loop, and each loop's return side carries the same current the other way. Four wires, not two — and of the four pairs they form, three push against the one the guide counts.",
  geometryDiagramNote:
    "The drawing is a cross-section, looking at the conductors end-on: ⊙ is current out of the page, ⊗ into it. The vertical scale is distorted on purpose — r is 3 mm while the loop heights are 20 and 58 mm, so a true-to-scale drawing would push the return conductors off the page and hide the very thing worth seeing. The arithmetic is direct: instead of 1/r the force goes as 1/r − 1/(r+h₂) − 1/(r+h₁) + 1/(r+h₁+h₂), and the percentage below says how much of the ideal force survives.",
  diagram: {
    activeWire: "weighed conductor",
    returnWire: "loop return",
    upperHeight: "h₁",
    lowerHeight: "h₂",
    attract: "attraction (parallel currents)",
    repel: "repulsion (antiparallel currents)",
    idealCaption: "What the guide models: two infinite wires",
    realCaption: "What the bench has: two closed loops",
    survives: "Force that survives",
  },

  circuitTitle: "4. The bench, running",
  circuitBody:
    "The setup of the guide's figure 2.1, with the current flowing. The detail that matters is that there is only one circuit: the 20 A supply feeds the 30 A unit, which enters CASSY channel B — in series, because B measures current — and from there passes through both loops, one after the other, before returning to the supply. That is why the same I appears twice in F = μ₀I²l/2πr: not two independent currents but one making a lap. It is also why the force goes as the square rather than linearly.",
  circuitNote:
    "The four horizontal conductors are in the same order as the cross-section in section 3, and the pulses run the way the current really does: the two facing conductors run the same way — which is why they attract — and each loop's return runs the other way, which is what subtracts. Move the slider to watch F grow as the square of I, or press ▶ Escalón to have the bench follow the real capture: the current has already arrived while the force is still rising, overshoots, and only then settles. Drop the rate to 0.1× to catch it. The arrow, the sensor's load bar and the readout come from the recorded samples, not from the formula. The loops are drawn still on purpose: r is set with the height screw and does not move during the measurement.",
  circuit: {
    supply: "20 A supply",
    unit30: "30 A unit",
    cassy: "Sensor-CASSY",
    bridge: "Bridge unit",
    forceSensor: "Force sensor",
    supportTop: "Support structure",
    supportBottom: "Height adjustment",
    upperLoop: "Suspended loop",
    lowerLoop: "Holder loop",
    current: "I",
    forceF: "F",
    separation: "r",
    upperHeight: "h₁",
    lowerHeight: "h₂",
    speed: "Speed",
    playStep: "▶ Step",
    playRamp: "▶ Continuous sweep",
    pause: "■ Stop",
    replayStepHint:
      "Replaying the real step capture on a loop. The current reaches 20 A in about 7 ms and the force takes more than twenty times that to settle: drop to 0.25× or 0.1× to see the overshoot and the return.",
    replayRampHint:
      "Replaying the continuous sweep. The sheet has no time column, so it is walked sample by sample at a nominal rate and the counter counts samples, not seconds.",
    manualHint:
      "Move the slider across the 0 to 20 A range. In this mode the force comes from the fitted slope, F = a·I², so it grows as the square: twice the current, four times the force.",
    elapsed: "t",
    sample: "n",
    load: "Sensor load",
  },

  stepTitle: "5. The step: how long each point has to wait",
  stepBody:
    "Before trusting any point it is worth knowing how slow the sensor is. This record is 1001 samples at 1 ms while the current is switched straight to 20 A and the force is left to follow. The current reaches its plateau almost immediately, so everything the force does afterwards is the sensor's mechanics, not the physics of the field.",
  stepReadNote:
    "The force balance is a spring with mass and friction: it overshoots and comes back. Press F9 too early and the logged point belongs to the transient rather than to steady state — overestimated if it lands on the overshoot, underestimated if it lands before. That is the concrete trade-off of this experiment: the guide asks for speed because the loop cannot hold 20 A, but every step needs the settling time read off below.",
  markersToggle: "Mark the characteristic times",
  chartTime: "t (s)",
  chartForce: "F (mN)",
  chartCurrent: "I (A)",
  hoverHint: "Move the cursor over the chart to read one instant.",
  bandLabel: "±2 % of final F",
  markerCurrent: "I at plateau",
  markerT10: "10 %",
  markerT90: "90 %",
  markerPeak: "peak",
  markerSettle: "settled ±2 %",
  stepMetricsTitle: "Step-response figures of merit",
  mForceSteady: "Steady-state F",
  mCurrentSteady: "Steady-state I",
  mCurrentSettled: "I at 99 % of its plateau",
  mRise: "Rise time (10→90 %)",
  mOvershoot: "Overshoot",
  mSettle: "Settling time (±2 %)",
  mZeta: "Equivalent damping ζ",
  mNatFreq: "Natural frequency f_n",

  curvesTitle: "6. The three F(I) runs",
  curvesBody:
    "The three stepped series the guide's step (c) asks for, on one pair of axes. The switch changes the horizontal axis between I and I²: against I the curve is the parabola the theory predicts; against I² it has to be a straight line, and on a straight line the eye catches a residual curvature it would never see on a parabola. That is the verification that F ∝ I², not decoration.",
  curvesSameRNote:
    "One honest caveat: step (f) asks for the sweep to be repeated at different separations r, and that was not done — the three series share the same slope to within 1 %, so they were taken at the same separation. This data cannot show the F ∝ 1/r dependence. What the repeats do measure is the repeatability of the setup, and that number turns out to be small next to the systematic error of section 10 — which is itself a result.",
  linearizeToggle: "Linearise: F against I²",
  curvesAxisI: "I (A)",
  curvesAxisI2: "I² (A²)",
  curvesAxisF: "F (mN)",
  curvesTableCaption: "Table 5.1. F = a·I² + b fit of each run.",
  colRun: "Run",
  colPoints: "Points",
  colSlope: "a (mN/A²)",
  colIntercept: "b (mN)",
  colR2: "r²",
  colMu0Ideal: "μ₀ ideal (H/m)",
  colMu0Corrected: "μ₀ corrected (H/m)",
  curvesLinearityNote: (r2) =>
    `Linearity is excellent: the worst r² of the three runs is ${r2}. The quadratic dependence on current is verified beyond doubt — whatever is wrong with this experiment, it is not here.`,
  curvesSpreadNote: (spreadPct) =>
    `The three slopes span only ${spreadPct} % between largest and smallest. The setup is repeatable; what fails is the model used to interpret it.`,

  rampTitle: "7. The continuous sweep",
  rampBody:
    "The same experiment without waiting: 314 samples logged while the knob is walked from 3 A up to 20 A and straight back. Plotted against I² the fit is still a line, and the two branches — up and down — ought to lie on top of each other. They do not quite, and the loop they enclose is the sensor's lag drawn on the F-I plane.",
  rampHysteresisNote: (hysteresisPct) =>
    `The loop is ${hysteresisPct} % of the force at the turning point. That is small — much smaller than the hysteresis of Lab 1's sweep — because the knob moved slowly compared with the sensor's settling. It is the direct confirmation that the stepped runs, which additionally wait at each point, do not carry this error.`,
  rampAxisI2: "I² (A²)",
  rampAxisF: "F (mN)",
  rampRising: "Rising",
  rampFalling: "Falling",
  rampOverallFit: "Overall fit",
  rampRisingFit: "Rising fit",
  rampFallingFit: "Falling fit",
  mRampPeak: "Turning current",
  mRampSlope: "Slope a of the overall fit",
  mRampR2: "r² of the overall fit",
  mRampGap: "Mean loop width",
  mRampHysteresis: "Relative hysteresis",

  resultTitle: "8. The value of μ₀",
  resultBody:
    "Three independent routes to the same slope: the stepped runs, the continuous sweep and the step plateau. Each is turned into μ₀ twice — with the guide's ideal model, and with the four real conductors.",
  resultTableCaption:
    "Table 7.1. μ₀ by route, with and without the correction.",
  colRoute: "Route",
  colDelta: "Δ from accepted",
  routeCurves: "Stepped runs (mean)",
  routeRamp: "Continuous sweep",
  routeStep: "Step plateau",
  resultIdealNote: (mu0, deltaPct) =>
    `With the formula exactly as the guide writes it, μ₀ = ${mu0} H/m: ${deltaPct} % below the accepted value. The spread between the three routes is under 1 %, so this is not noise: all three are wrong together, and in the same direction. A systematic offset that size, on data this clean, points at the model rather than at the measurement.`,
  resultCorrectedNote: (mu0, deltaPct) =>
    `Replacing 1/r with the sum over the four conductors, the same data gives μ₀ = ${mu0} H/m, ${deltaPct} % from the accepted value. Nothing was fitted — the correction comes from two caliper readings — and it still absorbs almost the whole offset. That is the evidence that the model was the problem.`,
  resultFinal: (mu0, errorPct, deltaPct) =>
    `Reported result: μ₀ = ${mu0} H/m ± ${errorPct} % (the guide's §2.2 error evaluated at the strongest point of the curve). The accepted value sits ${deltaPct} % away — inside the error interval.`,
  mMu0Final: "Measured μ₀ (corrected)",
  mMu0Error: "Δμ₀/μ₀ (§2.2)",
  mMu0Delta: "Δ from accepted",
  mMu0Accepted: "Accepted μ₀",

  errorTitle: "9. Which term contributes the most error?",
  errorBody:
    "The question is answered along the curve, not at a point. The stacked bands are each term's share of Δμ₀; the line on the right axis is the total relative error. Three of the four terms — ΔI/I, ΔF/F and Δl/l — depend on the operating point, and two of them shrink as the current is raised. Δr/r does not move: it is the same 3 % across the whole range, because r does not change when I does.",
  errorAnswer: (dominantAtMax, sharePct, crossoverA) =>
    `At high current the dominant term is ${dominantAtMax}, at ${sharePct} % of Δμ₀. The crossover is near ${crossoverA} A: below it ΔF/F rules, because the force is a fraction of a mN while the sensor error is fixed; above it Δr/r rules, and no amount of current improves it. Length is always the smallest term — 1 mm in 302 mm is negligible next to everything else.`,
  errorPractical:
    "The practical consequence is twofold. First: the low-current points carry almost no information, and the fit should not let them weigh like the rest. Second, and more important: above 10 A this experiment is limited by a caliper reading of a tenth of a millimetre on a 3 mm separation. Improving the result needs neither a better sensor nor a steadier supply — it needs r measured better, or the conductors moved further apart and a smaller force accepted.",
  errorChart: {
    xAxis: "I (A)",
    shareAxis: "Share of Δμ₀ (%)",
    totalAxis: "Δμ₀/μ₀ (%)",
    current: "ΔI/I",
    length: "Δl/l",
    force: "ΔF/F",
    separation: "Δr/r",
    total: "total",
    hoverHint:
      "Move the cursor over the chart to read the split at a given current.",
  },

  noteTitle: "10. The guide's Nota: the loop's upper conductor",
  noteBody:
    "The guide closes by asking whether the systematic error introduced by the loop's upper conductor can be neglected, given the absolute error of the measurement. It is the central question of the report, and the numbers above answer it without ambiguity.",
  noteAnswer: (shortfallPct, budgetPct) =>
    `It cannot be neglected. The return conductors cancel ${shortfallPct} % of the force the ideal pair would give, while the absolute error of the measurement at its best point is ${budgetPct} %. The systematic effect is about three times the entire measurement error: it sits well outside the error bar, not inside it. Neglecting it is precisely what produces the 17 % offset of section 8.`,
  noteImplied: (impliedMm, measuredMm) =>
    `Another way to see it, without mentioning μ₀ at all. Take μ₀ as known and ask the ideal formula for the separation: it wants r = ${impliedMm} mm, when the caliper measured ${measuredMm} mm. The two-wire model needs the conductors 20 % further apart than they were, and that extra distance is exactly what stands in for the force the return conductors subtract.`,

  conclusionsTitle: "Conclusions",
  conclusionsBody: [
    "The F ∝ I² dependence is verified with r² better than 0.999 in all three runs. The guide's theoretical expression describes the shape of the curve well.",
    "The setup is repeatable: the three runs agree to within 1 %, and the continuous sweep, taken a different way, lands in the same place.",
    "Applied literally, the guide's formula gives μ₀ 17 % below the accepted value, and the three independent routes are wrong identically. A systematic offset on clean data is a model problem, not a measurement problem.",
    "The missing model is the one the guide itself hints at in its Nota: the conductors are not lone wires but sides of closed loops, and the three extra pairs cancel 14 % of the force. Correcting for it — with no fitted parameter, just two caliper readings — brings μ₀ to within 4 % of the accepted value, inside the measurement error.",
    "From the error analysis: at high current the dominant term is Δr/r, by a wide margin. r is the smallest quantity measured anywhere in the experiment and the one known worst in relative terms. At low current ΔF/F dominates simply because the force tends to zero while the sensor error does not.",
    "The only change that would substantially improve this experiment is measuring the conductor separation better. A finer force sensor or a steadier supply would not move the result.",
    "What was left undone: step (f) asks for curves at different r, and all three runs were taken at the same separation. That would have been the direct check of F ∝ 1/r and, incidentally, the cleanest way to expose the loop correction, which depends on r differently than the ideal term does.",
  ],

  bridgeTitle: "From magnetostatics to the simulator",
  bridgeBody:
    "This experiment and the previous one walk through magnetostatics from the force side: from current to field, and from field to the constant that links them. The simulator on this site comes at the syllabus from the other end — the electrostatic field solved numerically by relaxation — but shares the same underlying idea: a differential equation that only shows itself when you measure it or iterate it.",
};

export const LAB2_COPY: Record<Language, Lab2Copy> = { es: ES, en: EN };
