# Simulador de campo eléctrico — método de relajación

Aplicación web cliente-side que visualiza el campo electrostático en 2D
resolviendo la ecuación de Laplace `∇²V = 0` con sobre-relajación
sucesiva (SOR) sobre una grilla seleccionable por el usuario (80×80,
120×120 o 200×200). Dibujá conductores a mano o cargá geometrías
clásicas de libro y mirá cómo se forma el potencial, las equipotenciales
y los vectores de campo mientras el solver converge en tiempo real.

## Qué hace

- **Ocho geometrías predefinidas**: capacitor plano, dipolo, pararrayos
  simplificado, cable coaxial, jaula de Faraday, punta vs plano, placas
  conductoras en L, bundle de 4 subconductores AT.
- **Dibujo a mano alzada**: cuatro herramientas (`+V`, `−V`, tierra,
  borrar), preset de voltaje (100 V / 220 V / 100 kV / √(2/3)×500 kV),
  pincel ajustable (1–6), soporte para mouse y touch.
- **Cuatro capas de visualización**: mapa de calor del potencial
  (colormap divergente azul-blanco-rojo), curvas equipotenciales
  (marching squares), flechas del campo eléctrico (`E = −∇V` con
  diferencias centradas) y líneas de campo (integración RK2 sobre el
  campo muestreado por interpolación bilineal). Cada capa se activa o
  desactiva por separado; flechas y líneas son mutuamente excluyentes.
- **Vista 3D opcional**: render de `V(x, y)` como malla Three.js con
  el mismo colormap divergente y cámara orbital; corre en paralelo al
  lienzo 2D y se actualiza en vivo mientras el solver itera.
- **Solver en vivo**: SOR (`ω ≈ 1.9`) corre en un **Web Worker**
  dedicado, así la UI no se traba. La iteración y `Δmax` se actualizan
  en tiempo real; el loop se detiene solo cuando `Δmax < 10⁻³`.
- **Tamaño de grilla**: cambiá entre 80×80, 120×120 y 200×200 en tiempo
  de ejecución; el botón **Auto** recalcula el ω óptimo para cada N.
- **Condiciones de contorno**: el default es Neumann (∂V/∂n = 0) — las
  paredes de la región no son conductoras, así que el campo solo puede
  tener componente paralela al borde. Se puede cambiar a Dirichlet
  (V = 0 en las paredes — recinto aterrizado) para comparar, sin
  perder los conductores dibujados.
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

Requisitos: Node 20+ (Next.js 16), browser moderno con Web Worker y
`ArrayBuffer` transferable.

## Cómo se usa

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

## Presets

| ID               | Etiqueta                  | Qué se ve después de **Calcular**                                                               |
| ---------------- | ------------------------- | ------------------------------------------------------------------------------------------------ |
| `parallel`       | Capacitor plano           | `V` lineal entre las placas; `E` uniforme y vertical (capacitor de placas paralelas).           |
| `dipole`         | Dipolo                    | Equipotenciales con forma de cardioides; líneas de campo curvándose del disco `+` al `−`.       |
| `lightning`      | Pararrayos simplificado   | Placa superior a +100 kV, varilla aterrada abajo — equipotenciales se aprietan en la punta.     |
| `coaxial`        | Cable Coaxial             | Equipotenciales circulares concéntricas; campo radial saliendo del disco central.                |
| `faraday`        | Jaula de Faraday          | `V ≈ 0` y sin flechas dentro de la caja cerrada aterrada, incluso con campo externo.            |
| `tip`            | Punta vs plano            | Punta triangular a +80 V sobre plano aterrado — alta concentración de campo en el vértice.      |
| `conductors`     | Placas conductoras        | Geometría en L (placa horizontal +100 kV, placa vertical −100 kV); campos de franja en bordes.  |
| `subconductors`  | Línea 4 subconductores    | Bundle 2×2 de discos a √(2/3)×500 kV sobre plano de tierra — modela línea AT real.             |

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
valor medio de las funciones armónicas).

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

## Arquitectura

```
src/
  app/                     Shell de Next.js App Router (layout + page)
  components/
    Simulator.tsx          Estado top-level + plumbing del worker
    Canvas.tsx             Canvas 480×480, paint + touch + hover
    Surface3D.tsx          Malla Three.js de V(x, y), con cámara orbital
    Surface3DDynamic.tsx   Wrapper de dynamic-import de Next sobre Surface3D
    Toolbar.tsx            Herramientas, sliders de voltaje y pincel
    PresetSelect.tsx       Dropdown de los ocho presets
    DisplayToggles.tsx     Checkboxes por capa (heatmap / equipotenciales /
                           líneas de campo / flechas / superficie 3D)
    RunControls.tsx        Calcular / Paso / Reset V / Limpiar / grilla / contorno
    ExportControls.tsx     Botones de Guardar/Cargar y Exportar PNG
    SaveLoadDialog.tsx     Manager de localStorage + import/export JSON
    Legend.tsx             Leyenda del colormap + colores de conductores
  lib/
    grid.ts                GridState, idx, paintBrush/Stroke
    relaxation.ts          relaxStep (barrida SOR), DEFAULT_SOLVER_CONFIG
    rendering.ts           Heatmap / equipotenciales / flechas / líneas de campo / conductores
    colormap.ts            Lerp divergente azul-blanco-rojo
    presets.ts             Helpers de geometría + registro
    storage.ts             localStorage + import/export JSON
  workers/
    solver.worker.ts       Loop SOR, fuera del main thread
  types/
    index.ts               Tipos compartidos
    worker.ts              Protocolo de mensajes del worker
```

El **solver corre en un Web Worker**. El worker mantiene su propia
copia de `V / fixed / Vfix` y emite snapshots transferibles de `V`
al main thread cada pocas iteraciones. Pintar mientras el solver
itera dispara mensajes `updateFixed`; el worker re-aplica los valores
fijos entre barridas sin reiniciar el loop. Un contador `runToken`
descarta iteraciones huérfanas después de `pause` / `reset` / `init`,
así no quedan mensajes de progreso obsoletos en vuelo.

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

- Solo 2D; sin medios magnéticos.
- Grilla cuadrada de paso fijo (sin refinamiento adaptativo).
- Solo Laplace — sin densidad de carga `ρ` (sin soporte para Poisson).
- Permitividad uniforme (sin regiones dieléctricas).

## Licencia

MIT.
