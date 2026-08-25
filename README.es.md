# Simulador de campo eléctrico — método de relajación

Aplicación web cliente-side que visualiza el campo electrostático — en
**2D** (80×80 / 120×120 / 200×200) o **3D** (cubos de 40³ / 60³ / 80³
vóxeles) — resolviendo la ecuación de Laplace `∇²V = 0` con
sobre-relajación sucesiva (SOR). Dibujá conductores a mano o cargá
geometrías clásicas de libro y mirá cómo se forma el potencial, las
equipotenciales y los vectores de campo / líneas de campo en tiempo
real mientras el solver converge.

## Qué hace

- **Popover de configuración en el header**: un botón ⚙ al lado del
  link de GitHub abre un popover con el switch de modo 2D / 3D, el
  toggle de idioma ES / EN y el control de tema claro / oscuro /
  sistema; el modo y el tema elegidos quedan persistidos en
  `localStorage`.
- **Nueve geometrías 2D predefinidas**: capacitor plano, dipolo,
  pararrayos simplificado, cable coaxial, jaula de Faraday, punta vs
  plano, placas conductoras en L, bundle de 4 subconductores AT,
  línea trifásica + neutro.
- **Seis geometrías 3D predefinidas**: placas paralelas, dipolo, cable
  coaxial, pararrayos simplificado, jaula de Faraday, bundle de 4
  subconductores AT.
- **Dibujo 3D por vóxeles**: colocá cables, placas, esferas y
  cilindros con un modelo de dos clics anclados sobre un plano de
  corte; el slider de abajo del viewport mueve el corte, el mouse
  orbita la cámara.
- **Dibujo a mano alzada**: cuatro herramientas (`+V`, `−V`, tierra,
  borrar), preset de voltaje (100 V / 220 V / 100 kV / √(2/3)×500 kV),
  pincel ajustable (1–6), soporte para mouse y touch.
- **Cuatro capas de visualización**: mapa de calor del potencial
  (colormap divergente azul-blanco-rojo), curvas equipotenciales
  (marching squares), flechas del campo eléctrico (`E = −∇V` con
  diferencias centradas) y líneas de campo (integración RK2 sobre el
  campo muestreado por interpolación bilineal). Cada capa se activa o
  desactiva por separado; flechas y líneas son mutuamente excluyentes.
- **Vista 3D opcional (en modo 2D)**: render de `V(x, y)` como malla
  Three.js con el mismo colormap divergente y cámara orbital; corre
  en paralelo al lienzo 2D y se actualiza en vivo mientras el solver
  itera.
- **Solver en vivo**: SOR (`ω ≈ 1.9`) corre en un **Web Worker**
  dedicado en ambos modos, así la UI no se traba. La iteración y
  `Δmax` se actualizan en tiempo real; el loop se detiene solo cuando
  `Δmax < 10⁻³`.
- **Tamaño de grilla**: en 2D, cambiá entre 80×80, 120×120 y 200×200;
  en 3D, entre 40³, 60³ y 80³ — todo en tiempo de ejecución, y el
  botón **Auto** recalcula el ω óptimo para cada N.
- **Condiciones de contorno**: el default es Neumann (∂V/∂n = 0) — las
  paredes de la región no son conductoras, así que el campo solo puede
  tener componente paralela al borde. Se puede cambiar a Dirichlet
  (V = 0 en las paredes — recinto aterrizado) para comparar, sin
  perder los conductores dibujados.
- **Herramienta de traza**: dibujá un segmento recto o una curva libre
  sobre el lienzo para leer `V(s)` y `|E|(s)` a lo largo del recorrido
  en un gráfico Canvas2D de dos ejes (muestreo bilineal de `V`,
  diferencias centradas para `|E|`). Si hacés clic dos veces sobre la
  **misma celda** — o mousedown sin arrastrar con la curva — la traza
  se vuelve una **sonda** de un punto y registra `V(t)` y `|E|(t)` en
  el tiempo, en una franja temporal (strip chart) de los últimos 10
  segundos.
- **Modulación AC**: cada conductor fijo oscila como
  `V = Vfix · sin(ωt + φ)` con período seleccionable (0.1–60 s) y una
  fase `φ` por celda configurable al pintar (dipolos, configuraciones
  trifásicas, etc. quedan a un clic). Un segundo strip chart muestra
  la onda de referencia `sin(ωt)` para tener la modulación a la vista.
- **Guardar y cargar**: persistir geometrías por nombre en
  `localStorage`, exportar/importar como JSON, exportar el canvas
  renderizado a PNG.
- **Export estático**: produce un `out/` totalmente estático, sin
  runtime de servidor — deploya en cualquier hosting estático.

## Arranque rápido

```bash
npm install
npm run dev       # http://localhost:3000
```

Build de producción (export estático a `out/`):

```bash
npm run build
```

Requisitos: Node 24.15+, browser moderno con Web Worker y `ArrayBuffer`
transferable.

Correr los tests unitarios (Vitest, cubren `src/lib/*`):

```bash
npm test          # corrida única
npm run test:watch
```

## Cómo se usa

El popover **⚙ Configuración** del header (arriba a la derecha, al
lado del link de GitHub) tiene el switch de modo **2D / 3D**, el
idioma y el tema. Los dos modos comparten el cromo de la página pero
tienen toolbars, presets y solvers independientes.

### Modo 2D

1. Elegí una herramienta (`+V`, `−V`, `Tierra` o `Borrar`), seleccioná
   un preset de voltaje y ajustá el pincel.
2. Dibujá conductores en el lienzo o seleccioná un preset desde el
   dropdown **Preset** para cargar una geometría de referencia.
3. Apretá **Calcular** para arrancar el solver. El mapa de calor, las
   equipotenciales, las flechas o líneas de campo, y la superficie 3D
   opcional se actualizan a ~60 fps mientras las barridas SOR iteran
   en el worker.
4. **Pausar** detiene el loop, **Paso (50)** avanza una cantidad fija
   de iteraciones de manera sincrónica, **Reset V** pone V en cero
   manteniendo los conductores, **Limpiar** borra todo.
5. Usá el dropdown **Grilla** para cambiar la resolución y **Contorno**
   para alternar entre Neumann (default) y Dirichlet en cualquier
   momento; los conductores se conservan en ambos casos. La fila
   **Mostrar** prende y apaga cada capa por separado, incluyendo
   **Líneas de campo** y **Superficie 3D**.
6. **Guardar / Cargar** abre el diálogo de persistencia (guardar por
   nombre, borrar, importar/exportar JSON). **Exportar PNG** descarga
   el canvas como `campo.png`.
7. Pasá el cursor sobre cualquier celda para leer sus coordenadas,
   el potencial `V` y la magnitud `|E|` del campo en un panel chico
   en la esquina del lienzo.
8. **Herramienta de traza**: elegí **Traza recta** o **Curva libre**
   en la barra. Dos clics distintos (recta) o un arrastre (curva)
   arman una polilínea — el perfil `V(s)` / `|E|(s)` aparece debajo
   del lienzo. Hacé clic **dos veces sobre la misma celda** con la
   herramienta recta (o mousedown sin arrastrar con la curva) para
   dropear una sonda de un solo punto; el gráfico se convierte en una
   franja temporal de 10 s de `V(t)` y `|E|(t)` en ese punto.
9. **Modulación AC**: marcá **Modulación AC** y elegí el período en
   segundos. Cada celda fija oscila como `Vfix · sin(ωt + φ)`. Usá el
   campo **Fase** mientras pintás para configurar `φ` por celda
   (por ejemplo, un polo del dipolo a 0° y el otro a 180°). Aparece un
   strip chart adicional con la onda `sin(ωt)` de referencia
   scrolleando sobre los últimos 10 segundos. Pausar congela ambos
   strip charts; Reset V vacía el buffer de la sonda.

### Modo 3D

1. Elegí una primitiva — **Cable**, **Placa** (slab axis-aligned),
   **Esfera**, **Cilindro** — o **Borrar** para limpiar una región.
   Configurá el voltaje (positivo / negativo / tierra, preset o número
   personalizado), el **Grosor** (profundidad de placa o radio de
   cable), el **Radio** (esfera / cilindro) y el **Eje del corte** (a
   qué eje es perpendicular el plano de corte).
2. Modelo de dos clics sobre el plano de corte: el primer clic ancla,
   una línea fantasma amarilla punteada sigue al cursor, el segundo
   clic confirma. `Escape` cancela a mitad del trazo.
3. El slider de abajo desplaza el índice del corte por su eje, así
   podés colocar primitivas a cualquier profundidad; arrastrar con el
   mouse orbita la cámara cuando no hay ancla pendiente.
4. Tildá **Equipotenciales** y **Líneas de campo** para superponer
   contornos por marching squares sobre el corte y líneas de campo
   3D que recorren todo el volumen de `E`.
5. **Calcular / Pausar / Paso (20) / Reset V / Limpiar / Grilla**
   funcionan igual que en 2D. Los presets se cargan desde el dropdown
   **Preajuste**.

## Presets

### 2D

| ID              | Etiqueta                 | Qué se ve después de **Calcular**                                                                            |
| --------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `parallel`      | Capacitor plano          | `V` lineal entre las placas; `E` uniforme y vertical (capacitor de placas paralelas).                        |
| `dipole`        | Dipolo                   | Equipotenciales con forma de cardioides; líneas de campo curvándose del disco `+` al `−`.                    |
| `lightning`     | Pararrayos simplificado  | Placa superior a +100 kV, varilla aterrada abajo — equipotenciales se aprietan en la punta.                  |
| `coaxial`       | Cable Coaxial            | Equipotenciales circulares concéntricas; campo radial saliendo del disco central.                            |
| `faraday`       | Jaula de Faraday         | `V ≈ 0` y sin flechas dentro de la caja cerrada aterrada, incluso con campo externo.                         |
| `tip`           | Punta vs plano           | Punta triangular a +80 V sobre plano aterrado — alta concentración de campo en el vértice.                   |
| `conductors`    | Placas conductoras       | Geometría en L (placa horizontal +100 kV, placa vertical −100 kV); campos de franja en bordes.               |
| `subconductors` | Línea 4 subconductores   | Bundle 2×2 de discos a √(2/3)×500 kV sobre plano de tierra — modela línea AT real.                           |
| `threephase`    | Línea trifásica + neutro | Tres discos a √(2/3)×500 kV con fases AC 0°/120°/240° más un disco aterrado (neutro), sobre plano de tierra. |

### 3D

| ID              | Etiqueta                     | Geometría                                                                              |
| --------------- | ---------------------------- | -------------------------------------------------------------------------------------- |
| `parallel`      | Placas paralelas (3D)        | Dos slabs horizontales a ±100 V perpendiculares a Y — capacitor de placas en volumen.  |
| `dipole`        | Dipolo (3D)                  | Dos slabs chicos a ±100 V en lados opuestos — campo dipolar simétrico.                 |
| `coax`          | Cable coaxial (3D)           | Cilindro exterior aterrado + conductor interno a +80 V a lo largo del eje.             |
| `lightning`     | Pararrayos simplificado (3D) | Placa superior +100 kV, piso aterrado + varilla vertical aterrada — campo en la punta. |
| `faraday`       | Jaula de Faraday (3D)        | Placa excitada + piso aterrado + caja cerrada aterrada — interior apantallado.         |
| `subconductors` | Línea 4 subconductores (3D)  | Plano de tierra + bundle 2×2 de cilindros a √(2/3)×500 kV — versión 3D del bundle.     |

## La matemática

La ecuación de Laplace `∇²V = 0`, discretizada en una grilla cuadrada
de paso `h` con diferencias finitas de segundo orden:

```
∂²V/∂x² ≈ (V[i+1,j] − 2 V[i,j] + V[i−1,j]) / h²
∂²V/∂y² ≈ (V[i,j+1] − 2 V[i,j] + V[i,j−1]) / h²
```

Imponiendo `∇²V = 0` y despejando `V[i,j]`:

```
V[i,j] = (V[i+1,j] + V[i−1,j] + V[i,j+1] + V[i,j−1]) / 4
```

Cada nodo no fijo es el promedio de sus cuatro vecinos (propiedad del
valor medio de las funciones armónicas). En **modo 3D**, la misma
construcción se extiende a un stencil de 6 vecinos — `V[i,j,k]` queda
como el promedio de sus vecinos `±x / ±y / ±z`, dividido por 6.

**SOR (sobre-relajación sucesiva)** acelera la iteración de Gauss-Seidel:

```
avg     = (V[i+1,j] + V[i−1,j] + V[i,j+1] + V[i,j−1]) / 4
V[i,j] := V[i,j] + ω · (avg − V[i,j])
```

El `ω` óptimo para una grilla `N × N` con Dirichlet es
`2 / (1 + π / N)` — alrededor de `1.924` para `N = 80` y `1.949` para
`N = 200`. El botón **Auto** calcula esto exactamente para el tamaño
activo. El default es `ω = 1.9`. El criterio de corte es
`Δmax = max |V_new − V_old| < 10⁻³`, típicamente alcanzado en menos
de 400 iteraciones en 80².

El campo se obtiene del potencial convergido por diferencias centradas:

```
Ex = −(V[i+1,j] − V[i−1,j]) / 2
Ey = −(V[i,j+1] − V[i,j−1]) / 2
```

## Capas de render

- **Mapa de calor**: un `ImageData` de `N×N` coloreado con un colormap
  divergente azul-blanco-rojo (`−Vmax → 0 → +Vmax`), después escalado
  bilineal al canvas de 480×480.
- **Equipotenciales**: 13 niveles equiespaciados en `[−Vmax, +Vmax]`
  sin el cero. Marching squares con desambiguación de saddles por
  promedio de las cuatro esquinas.
- **Flechas del campo**: muestreo sub-grilla cada 5 celdas. Longitud
  proporcional a `sqrt(|E| / Emax)`, orientadas por `atan2(Ey, Ex)`,
  con punta triangular.
- **Líneas de campo (streamlines)**: semillas en una sub-grilla
  uniforme, trazadas con integración RK2 (midpoint) sobre el campo
  unitario, muestreado por interpolación bilineal de `E`, en ambas
  direcciones. Una máscara `visited[]` evita que las líneas se
  apiñen; la integración corta al llegar al borde del dominio, a un
  conductor o a campo nulo. Se dibujan cabezas de flecha cada ~80 px
  a lo largo del recorrido.
- **Superficie 3D**: `V(x, y)` se renderiza como un `PlaneGeometry`
  de Three.js (un vértice por celda) con altura por vértice
  `v / vmax` y color por vértice usando el mismo colormap divergente.
  Las capas 2D y la malla 3D comparten `grid.V`; ambas se invalidan
  con el mismo `renderTick`, así quedan en sincro mientras el solver
  itera.
- **Conductores** pintados al final, opacos (`#791F1F` para `+V`,
  `#0C447C` para `−V`, `#2C2C2A` para tierra).

En **modo 3D** el panorama cambia: una escena Three.js
(`@react-three/fiber`) renderiza el dominio `[-0.5, 0.5]³` como un
wireframe cúbico con los **conductores como cajas de vóxeles
instanciadas** (un `InstancedMesh` coloreado por `Vfix` con el mismo
colormap divergente, hasta 80k instancias), más un **plano de corte
texturizado** (la sección perpendicular al eje elegido de `V`,
pintada vía `CanvasTexture` y con superposición opcional de contornos
por marching squares) y **líneas de campo 3D de volumen completo**
trazadas sobre `E = −∇V`. El eje y el índice del corte, la
superposición de equipotenciales y las líneas de campo se prenden y
apagan por separado.

## Arquitectura

```
src/
  app/                     Shell de Next.js App Router (layout + page)
  components/
    SimulatorRoot.tsx      Cromo de la página (header + footer) + dispatch 2D/3D
    SettingsPanel.tsx      Popover ⚙: modo 2D/3D + idioma + tema (en el header)
    Simulator.tsx          2D: estado top-level + plumbing del worker
    Canvas.tsx             Canvas 480×480, paint + touch + hover + traza
    Surface3D.tsx          Malla 3D opcional del modo 2D (V(x, y) en Three.js)
    Surface3DDynamic.tsx   Wrapper de dynamic-import de Next sobre Surface3D
    Toolbar.tsx            2D: herramientas, sliders de voltaje / pincel / fase
    PresetSelect.tsx       Dropdown de los nueve presets 2D
    DisplayToggles.tsx     Checkboxes por capa 2D (heatmap / equipotenciales /
                           líneas de campo / flechas / superficie 3D)
    RunControls.tsx        Calcular / Paso / Reset V / Limpiar / grilla / contorno
    ACControls.tsx         Activar AC + período + lectura ωt / sin(ωt) en vivo
    ExportControls.tsx     Botones de Guardar/Cargar y Exportar PNG
    SaveLoadDialog.tsx     Manager de localStorage + import/export JSON
    Legend.tsx             Leyenda del colormap + colores de conductores
    TraceChart.tsx         Gráfico de perfil V(s) / |E|(s) (traza de 2+ puntos)
    StripChart.tsx         Onda AC sin(ωt) + sonda V(t) / |E|(t) en franja
                           temporal de 10 s (traza de 1 punto)
    Simulator3D.tsx        3D: estado top-level + plumbing del worker
    Toolbar3D.tsx          3D: primitivas, voltaje / grosor / radio / eje del corte
    Viewport3D.tsx         Canvas r3f: vóxeles instanciados + plano de corte + líneas 3D
    Viewport3DDynamic.tsx  Wrapper de dynamic-import de Next sobre Viewport3D
    MethodExplanation.tsx  Bloque de notas (relajación / traza / AC)
    ProjectCredits.tsx     <footer> de la página con créditos de cátedra y equipo
    GitHubLink.tsx         Link al repo
  lib/
    grid.ts                GridState, idx, paintBrush/Stroke, applyModulatedFixed
    relaxation.ts          relaxStep (barrida 2D SOR), DEFAULT_SOLVER_CONFIG
    rendering.ts           Heatmap / equipotenciales / flechas / líneas de campo / traza
    sampling.ts            sampleV, sampleE, sampleTrace (interpolación bilineal)
    chartUtils.ts          niceTicks, formatNum (compartidos por Trace + StripChart)
    colormap.ts            Lerp divergente azul-blanco-rojo
    presets.ts             Helpers de geometría 2D + registro (nueve presets)
    storage.ts             localStorage + import/export JSON
    grid3d.ts              Grid3DState, idx3, applyBoundary3D / applyFixedValues3D
    relaxation3d.ts        relaxStep3D (SOR 6 vecinos), DEFAULT_SOLVER_CONFIG_3D
    rendering3d.ts         sampleSlice, paintSliceRGBA, contornos por marching squares,
                           computeStreamlines3D (líneas de campo 3D de volumen completo)
    primitives3d.ts        Rasterizadores de vóxeles (cable / placa / esfera / cilindro)
    presets3d.ts           Registro de presets 3D (seis presets)
  workers/
    solver.worker.ts       Loop SOR 2D + acumulador de fase AC
    solver3d.worker.ts     Loop SOR 3D (sin AC)
  contexts/
    LanguageContext.tsx    Traducciones ES / EN + provider
  types/
    index.ts               Tipos 2D (GridState, AcConfig, TraceShape, ...)
    worker.ts              Protocolo de mensajes del worker 2D
    grid3d.ts              Tipos 3D (Grid3DState, Primitive3D, Tool3D, SliceAxis)
    worker3d.ts            Protocolo de mensajes del worker 3D
```

El **solver corre en un Web Worker** en ambos modos. Cada worker
mantiene su propia copia de los arrays del campo y emite snapshots
transferibles de `V` al main thread cada pocas iteraciones. Pintar
mientras el solver itera dispara mensajes `updateFixed`; el worker
re-aplica los valores fijos entre barridas sin reiniciar el loop. En
2D, `setAC` activa el modo AC y ajusta el período en caliente, y el
worker emite `acPhaseRad` junto con cada evento de progreso. Un
contador `runToken` descarta iteraciones huérfanas después de
`pause` / `reset` / `init`, así no quedan mensajes de progreso
obsoletos en vuelo.

## Performance

Presupuesto objetivo en una notebook moderna:

| Grilla | Iteración SOR | Tiempo a converger | Render por frame |
| ------ | ------------: | -----------------: | ---------------: |
| 80²    |        < 1 ms |           < 100 ms |           < 8 ms |
| 150²   |        < 3 ms |           < 500 ms |          < 15 ms |
| 200²   |        < 6 ms |            < 1.5 s |          < 25 ms |

Si 80² no converge en menos de 100 ms hay alguna alocación dentro
del hot loop — empezar mirando `lib/relaxation.ts`.

## Stack técnico

- Next.js 16 (App Router + Turbopack, el bundler default en v16)
- React 19, TypeScript en modo strict + `noUncheckedIndexedAccess`
- Tailwind CSS v4 vía `@tailwindcss/postcss`
- Canvas 2D para las capas 2D (heatmap / equipotenciales / flechas /
  líneas de campo)
- Three.js (vía `@react-three/fiber` + `@react-three/drei`) solo para
  la vista 3D opcional; se importa con `next/dynamic` para que el
  bundle de la vista 2D quede liviano
- Web Worker para el solver, `Float32Array` / `Uint8Array`
  transferables para streaming de progreso sin copias
- `localStorage` para persistencia; `canvas.toBlob` para export a PNG
- Vercel Analytics (`@vercel/analytics`, montado como `<Analytics />`
  en `layout.tsx`)
- Vitest para tests unitarios sobre `src/lib/*`

## Deploy

El proyecto está configurado para export estático
(`output: "export"` en `next.config.ts`). Después de `npm run build`,
subir el contenido de `out/` a cualquier hosting estático: Vercel,
Cloudflare Pages, GitHub Pages, Netlify, S3 + CloudFront, etc.

Una línea con Vercel:

```bash
vercel --prod
```

## Limitaciones conocidas

- Sin medios magnéticos.
- Grilla cuadrada / cubo de vóxeles de paso fijo (sin refinamiento
  adaptativo).
- Solo Laplace — sin densidad de carga `ρ` (sin soporte para Poisson).
- Permitividad uniforme (sin regiones dieléctricas).
- La modulación AC existe solo en el modo 2D.

## Licencia

MIT.
