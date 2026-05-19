# Simulador de campo eléctrico — método de relajación

Aplicación web cliente-side que visualiza el campo electrostático en 2D
resolviendo la ecuación de Laplace `∇²V = 0` con sobre-relajación
sucesiva (SOR) sobre una grilla de 80×80. Dibujá conductores a mano o
cargá geometrías clásicas de libro y mirá cómo se forma el potencial,
las equipotenciales y los vectores de campo mientras el solver converge
en tiempo real.

## Qué hace

- **Seis geometrías predefinidas**: placas paralelas, dipolo, pararrayos
  + nube, coaxial cuadrado, jaula de Faraday, punta vs plano.
- **Dibujo a mano alzada**: cuatro herramientas (`+V`, `−V`, tierra,
  borrar), voltaje ajustable (10–100), pincel ajustable (1–6), soporte
  para mouse y touch.
- **Tres capas de visualización**: mapa de calor del potencial
  (colormap divergente azul-blanco-rojo), curvas equipotenciales
  (marching squares) y flechas del campo eléctrico (`E = −∇V` con
  diferencias centradas). Cada capa se activa o desactiva por separado.
- **Solver en vivo**: SOR (`ω ≈ 1.9`) corre en un **Web Worker**
  dedicado, así la UI no se traba. La iteración y `Δmax` se actualizan
  en tiempo real; el loop se detiene solo cuando `Δmax < 10⁻³`.
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

1. Elegí una herramienta (`+V`, `−V`, `Tierra` o `Borrar`) y ajustá
   voltaje y pincel.
2. Dibujá conductores en el lienzo o seleccioná un preset desde el
   dropdown **Preset** para cargar una geometría de referencia.
3. Apretá **Calcular** para arrancar el solver. El mapa de calor, las
   equipotenciales y las flechas se actualizan a ~60 fps mientras las
   barridas SOR iteran en el worker.
4. **Pausar** detiene el loop, **Paso (50)** avanza una cantidad fija
   de iteraciones de manera sincrónica, **Reset V** pone V en cero
   manteniendo los conductores, **Limpiar** borra todo.
5. **Guardar / Cargar** abre el diálogo de persistencia (guardar por
   nombre, borrar, importar/exportar JSON). **Exportar PNG** descarga
   el canvas como `campo.png`.
6. Pasá el cursor sobre cualquier celda para leer sus coordenadas,
   el potencial `V` y la magnitud `|E|` del campo en un panel chico
   en la esquina del lienzo.

## Presets

| Preset             | Qué se ve después de **Calcular**                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| Placas paralelas   | `V` lineal entre las placas; `E` uniforme y vertical.                                              |
| Dipolo             | Equipotenciales con forma de cardioides; líneas de campo curvándose de `+` a `−`.                 |
| Pararrayos + nube  | Las equipotenciales se aprietan visiblemente cerca de la punta — el famoso efecto punta.          |
| Coaxial cuadrado   | Equipotenciales cuadradas concéntricas; campo radial saliendo del conductor central.               |
| Jaula de Faraday   | `V ≈ 0` y sin flechas dentro del recinto cerrado, incluso con carga externa — apantallamiento.   |
| Punta vs plano    | Densidad de equipotenciales mucho mayor cerca de la punta que del plano.                          |

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
`2 / (1 + π / N)` — alrededor de `1.924` para `N = 80`. Usamos
`ω = 1.9` como default seguro. El criterio de corte es
`Δmax = max |V_new − V_old| < 10⁻³`, típicamente alcanzado en menos
de 400 iteraciones en 80².

El campo se obtiene del potencial convergido por diferencias centradas:

```
Ex = −(V[i+1,j] − V[i−1,j]) / 2
Ey = −(V[i,j+1] − V[i,j−1]) / 2
```

## Capas de render

- **Mapa de calor**: un `ImageData` de 80×80 coloreado con un colormap
  divergente azul-blanco-rojo (`−Vmax → 0 → +Vmax`), después escalado
  bilineal al canvas de 480×480.
- **Equipotenciales**: 13 niveles equiespaciados en `[−Vmax, +Vmax]`
  sin el cero. Marching squares con desambiguación de saddles por
  promedio de las cuatro esquinas.
- **Flechas del campo**: muestreo sub-grilla cada 5 celdas. Longitud
  proporcional a `sqrt(|E| / Emax)`, orientadas por `atan2(Ey, Ex)`,
  con punta triangular.
- **Conductores** pintados al final, opacos (`#791F1F` para `+V`,
  `#0C447C` para `−V`, `#2C2C2A` para tierra).

## Arquitectura

```
src/
  app/                     Shell de Next.js App Router (layout + page)
  components/
    Simulator.tsx          Estado top-level + plumbing del worker
    Canvas.tsx             Canvas 480×480, paint + touch + hover
    Toolbar.tsx            Herramientas, sliders de voltaje y pincel
    PresetSelect.tsx       Dropdown de los seis presets
    DisplayToggles.tsx     Checkboxes de visibilidad de capas
    RunControls.tsx        Calcular / Paso / Reset V / Limpiar
    ExportControls.tsx     Botones de Guardar/Cargar y Exportar PNG
    SaveLoadDialog.tsx     Manager de localStorage + import/export JSON
    Legend.tsx             Leyenda del colormap + colores de conductores
  lib/
    grid.ts                GridState, idx, paintBrush/Stroke
    relaxation.ts          relaxStep (barrida SOR), DEFAULT_SOLVER_CONFIG
    rendering.ts           Heatmap / equipotenciales / flechas / conductores
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
- Canvas 2D API solamente — sin Three.js, sin WebGL, sin D3
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
- Solo Laplace — sin densidad de carga `ρ` (Poisson está en
  `TASK.md §17` como extensión futura).
- Permitividad uniforme (sin regiones dieléctricas).
- El tamaño de la grilla está fijo en `Simulator.tsx` con
  `GRID_N = 80`; el solver soporta cualquier `N`.

## Licencia

MIT.
