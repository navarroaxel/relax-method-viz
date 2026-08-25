# Electrostatic Field Simulator — Relaxation Method

A client-side web app that visualizes the electrostatic field — in **2D**
(80×80 / 120×120 / 200×200) or **3D** (40³ / 60³ / 80³ voxel cube) — by
solving Laplace's equation `∇²V = 0` with successive over-relaxation (SOR).
Draw conductors by hand or load classic textbook geometries, watch the
potential, equipotentials, and field vectors / streamlines develop in real
time as the solver converges.

## Features

- **Settings popover in the header**: a single ⚙ button next to the
  GitHub link opens a popover with the 2D / 3D mode switch, the
  ES / EN language toggle, and the light / dark / system theme
  control; mode and theme choices are remembered in `localStorage`.
- **Nine built-in 2D geometries**: flat capacitor, dipole, simplified
  lightning rod, coaxial cable, Faraday cage, tip-vs-plane, L-shaped
  conducting plates, 4-subconductor HV bundle, three-phase line +
  neutral.
- **Six built-in 3D geometries**: parallel plates, dipole, coaxial
  cable, simplified lightning rod, Faraday cage, 4-subconductor HV
  bundle.
- **3D voxel drawing**: place wires, plates, spheres, and cylinders by
  two-click anchoring on an axis-aligned slice plane; scrub the slice
  position with the bottom slider, orbit the camera with the mouse.
- **Freehand drawing**: paint conductors with four tools (`+V`, `−V`,
  ground, erase), voltage preset (100 V / 220 V / 100 kV / √(2/3)×500 kV)
  and brush size (1–6), mouse and touch supported.
- **Four visualization layers**: potential heatmap (divergent
  blue-white-red colormap), equipotential lines (marching squares),
  electric-field arrows (`E = −∇V` via centered differences), and
  field-line streamlines (RK2 integration through the bilinearly
  sampled field). Each layer toggles independently; arrows and
  streamlines are mutually exclusive.
- **Optional 3D surface view (in 2D mode)**: render `V(x, y)` as a
  Three.js mesh with the same divergent colormap, orbit-controlled
  camera; runs alongside the 2D canvas and updates live as the solver
  iterates.
- **Live solver**: SOR (`ω ≈ 1.9`) runs in a dedicated **Web Worker**
  for both 2D and 3D modes, so the UI never blocks. Iteration count
  and `Δmax` update in real time; the loop stops automatically at
  `Δmax < 10⁻³`.
- **Grid size**: 2D switches between 80×80, 120×120, and 200×200; 3D
  between 40³, 60³, and 80³ — both at runtime, and the **Auto** button
  recomputes the optimal ω for the current N.
- **Boundary conditions**: defaults to Neumann (∂V/∂n = 0) — the region
  walls are non-conductive, so the field can only have a component
  parallel to them. Switch to Dirichlet (V = 0 at walls — grounded
  enclosure) for comparison without losing the current conductor layout.
- **Trace tool**: drop a straight segment or freehand curve on the
  canvas to read `V(s)` and `|E|(s)` along the path in a dual-axis
  Canvas2D chart (bilinear sampling of `V`, centered differences for
  `|E|`). Click the same cell twice (or mousedown without dragging on
  the curve tool) to drop a single-point **probe** that records
  `V(t)` and `|E|(t)` over time in a scrolling 10-second strip chart.
- **AC modulation**: drive every fixed conductor as
  `V = Vfix · sin(ωt + φ)` with a user-selectable period (0.1–60 s)
  and a per-cell phase set while painting (so dipoles, three-phase
  configurations, etc. are one-click setups). A second strip chart
  plots the reference `sin(ωt)` waveform so the modulation is visible
  at a glance.
- **Save / load**: name and persist geometries in `localStorage`,
  export/import as JSON, export the rendered canvas as PNG.
- **Static export**: produces a fully static `out/` directory with no
  server runtime — deploys to any static host.

## Quick start

```bash
npm install
npm run dev       # http://localhost:3000
```

Production build (static export to `out/`):

```bash
npm run build
```

Requirements: Node 24.15+, modern browser with Web Worker and transferable
`ArrayBuffer` support.

Run the unit tests (Vitest, covering `src/lib/*`):

```bash
npm test          # single run
npm run test:watch
```

## Using the app

The header's **⚙ Settings** popover (top-right, next to the GitHub
link) holds the **2D / 3D** mode switch, language, and theme. The two
modes share the page chrome but otherwise have independent toolbars,
presets, and solvers.

### 2D mode

1. Pick a tool (`+V`, `−V`, `Tierra`, or `Borrar`), choose a voltage preset,
   and set the brush size.
2. Either draw conductors on the canvas or select a preset from the
   **Preset** dropdown to load a textbook geometry.
3. Press **Calcular** to start the solver. The heatmap, equipotentials,
   field arrows or streamlines, and the optional 3D surface update at
   ~60 fps as SOR sweeps iterate in the worker.
4. **Pausar** stops the loop, **Paso (50)** advances a fixed number of
   iterations synchronously, **Reset V** zeros the potential while
   keeping conductors, **Limpiar** wipes everything.
5. Use the **Grilla** dropdown to switch grid resolution and **Contorno**
   to toggle between Neumann (default) and Dirichlet boundaries
   mid-session; conductors are preserved in both cases. The **Mostrar**
   row toggles each visualization layer individually, including
   **Líneas de campo** (streamlines) and **Superficie 3D**.
6. **Guardar / Cargar** opens the persistence dialog (save by name,
   delete, import/export JSON). **Exportar PNG** downloads the current
   canvas as `campo.png`.
7. Hover over any cell to read its grid coordinates, potential `V`, and
   field magnitude `|E|` from a small overlay in the canvas corner.
8. **Trace tool**: pick **Traza recta** (straight) or **Curva libre**
   (freehand) from the toolbar. Two distinct clicks (straight) or a
   drag (curve) build a polyline — the `V(s)` / `|E|(s)` profile shows
   up below the canvas. Click the **same cell twice** with the straight
   tool, or click without dragging with the curve tool, to drop a
   single-point probe; the chart then becomes a scrolling 10-second
   time series of `V(t)` and `|E|(t)` at that point.
9. **AC modulation**: tick **Modulación AC**, pick a period in seconds.
   Every fixed cell oscillates as `Vfix · sin(ωt + φ)`. Use the
   **Fase** field while painting to set per-cell `φ` (e.g. paint one
   pole of a dipole at 0° and the other at 180°). A separate strip
   chart shows the reference `sin(ωt)` waveform scrolling over the
   last 10 seconds. Pausing the run freezes both strip charts; Reset V
   clears the probe buffer.

### 3D mode

1. Pick a primitive — **Cable** (wire), **Placa** (axis-aligned slab),
   **Esfera**, **Cilindro** — or **Borrar** to wipe a region. Set the
   voltage (positive / negative / ground, voltage preset, or custom
   number), the **Grosor** (plate depth / wire radius), the **Radio**
   (sphere / cylinder), and the **Eje del corte** (which axis the
   slice plane is perpendicular to).
2. Two-click placement on the slice plane: the first click anchors,
   a yellow dashed ghost line follows the cursor, the second click
   commits. `Escape` cancels mid-stroke.
3. The bottom slider scrubs the slice index along the chosen axis
   so you can place primitives at any depth; mouse-drag orbits the
   camera when no anchor is pending.
4. Toggle **Equipotenciales** and **Líneas de campo** to show
   marching-squares contours on the slice and full-volume 3D
   streamlines through `E`, respectively.
5. **Calcular / Pausar / Paso (20) / Reset V / Limpiar / Grilla**
   behave exactly as in 2D mode. Presets load via the **Preajuste**
   dropdown.

## Presets

### 2D

| Preset ID       | Label                    | What you should see after **Calcular**                                                                          |
| --------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `parallel`      | Capacitor plano          | Linear `V` between the plates; uniform vertical `E` (textbook parallel-plate capacitor).                        |
| `dipole`        | Dipolo                   | Cardioid-shaped equipotentials; field lines curving from `+` disc to `−` disc.                                  |
| `lightning`     | Pararrayos simplificado  | Top plate at +100 kV, grounded rod below — equipotentials compress sharply near the rod tip.                    |
| `coaxial`       | Cable Coaxial            | Concentric circular equipotentials; radial field outward from the inner disc.                                   |
| `faraday`       | Jaula de Faraday         | `V ≈ 0` and no arrows inside the grounded closed box, even with an external field — cage screens.               |
| `tip`           | Punta vs plano           | Triangular tip at +80 V over a grounded plate — high field density near the apex.                               |
| `conductors`    | Placas conductoras       | L-shaped geometry (horizontal +100 kV plate, vertical −100 kV plate); fringe fields at edges.                   |
| `subconductors` | Línea 4 subconductores   | 2×2 bundle of discs at √(2/3)×500 kV over a ground plane — models a 4-subconductor HV bundle.                   |
| `threephase`    | Línea trifásica + neutro | Three discs at √(2/3)×500 kV with AC phases 0°/120°/240° plus one grounded (neutral) disc, over a ground plane. |

### 3D

| Preset ID       | Label                        | Geometry                                                                               |
| --------------- | ---------------------------- | -------------------------------------------------------------------------------------- |
| `parallel`      | Placas paralelas (3D)        | Two horizontal slabs at ±100 V perpendicular to Y — 3D parallel-plate capacitor.       |
| `dipole`        | Dipolo (3D)                  | Two small ±100 V slabs on opposite sides — symmetric dipole field.                     |
| `coax`          | Cable coaxial (3D)           | Grounded outer cylinder + inner conductor at +80 V along the axis.                     |
| `lightning`     | Pararrayos simplificado (3D) | Top plate +100 kV, grounded floor + grounded vertical rod — field concentrates on tip. |
| `faraday`       | Jaula de Faraday (3D)        | Driven plate + grounded floor + grounded closed box — interior shielded.               |
| `subconductors` | Línea 4 subconductores (3D)  | Ground plane + 2×2 cylinder bundle at √(2/3)×500 kV — full 3D version of the bundle.   |

## The math

The Laplace equation `∇²V = 0`, discretized on a square grid with step `h`
using second-order centered differences:

```
∂²V/∂x² ≈ (V[i+1,j] − 2 V[i,j] + V[i−1,j]) / h²
∂²V/∂y² ≈ (V[i,j+1] − 2 V[i,j] + V[i,j−1]) / h²
```

Imposing `∇²V = 0` and solving for `V[i,j]`:

```
V[i,j] = (V[i+1,j] + V[i−1,j] + V[i,j+1] + V[i,j−1]) / 4
```

Each non-fixed node is the average of its four neighbors (the mean-value
property of harmonic functions). In **3D mode** the same construction
extends to a 6-neighbor stencil — `V[i,j,k]` becomes the average of
its `±x / ±y / ±z` neighbors, divided by 6.

**SOR (successive over-relaxation)** accelerates the Gauss-Seidel iteration:

```
avg     = (V[i+1,j] + V[i−1,j] + V[i,j+1] + V[i,j−1]) / 4
V[i,j] := V[i,j] + ω · (avg − V[i,j])
```

The optimal `ω` for an `N × N` grid with Dirichlet boundaries is
`2 / (1 + π / N)` — about `1.924` for `N = 80` and `1.949` for `N = 200`.
The **Auto** button computes this exactly for the active grid size. The
default is `ω = 1.9`. The stopping criterion is
`Δmax = max |V_new − V_old| < 10⁻³`, typically reached in under 400
iterations on 80².

The field is recovered from the converged potential by centered
differences:

```
Ex = −(V[i+1,j] − V[i−1,j]) / 2
Ey = −(V[i,j+1] − V[i,j−1]) / 2
```

## Rendering layers

- **Heatmap**: an `N×N` `ImageData` colored with a divergent
  blue-white-red colormap (`−Vmax → 0 → +Vmax`), then bilinearly
  upscaled onto the 480×480 display canvas.
- **Equipotentials**: 13 levels equispaced in `[−Vmax, +Vmax]` excluding
  zero. Marching squares with mean-of-corners disambiguation for
  saddles.
- **Field arrows**: sub-grid sampling every 5 cells. Arrow length
  scales as `sqrt(|E| / Emax)`, oriented by `atan2(Ey, Ex)`, with a
  triangular head.
- **Streamlines (líneas de campo)**: seeded on a uniform sub-grid,
  traced by RK2 (midpoint) integration of the unit field through
  bilinearly sampled `E`, both directions. A `visited[]` mask keeps
  lines from bunching, and integration stops on the domain edge, a
  conductor, or zero field. Arrowheads are placed every ~80 px along
  the path.
- **3D surface**: `V(x, y)` is rendered as a Three.js `PlaneGeometry`
  (one vertex per grid cell) with per-vertex height `v / vmax` and
  per-vertex color from the same divergent colormap. The 2D layers
  and the 3D mesh share `grid.V`; both are invalidated by the same
  `renderTick`, so they stay in sync as the solver iterates.
- **Conductors** are painted last, opaquely (`#791F1F` for `+V`,
  `#0C447C` for `−V`, `#2C2C2A` for ground).

In **3D mode** the picture changes: a Three.js (`@react-three/fiber`)
scene renders the `[-0.5, 0.5]³` domain as a wireframe cube with
**conductors as instanced voxel boxes** (one `InstancedMesh` colored
by `Vfix` with the same divergent colormap, capped at 80k instances),
plus a **textured slice plane** (the axis-perpendicular cross-section
of `V`, painted via `CanvasTexture` and optionally overlaid with
marching-squares contours) and **full-volume 3D streamlines** traced
through `E = −∇V`. The slice axis and index, equipotential overlay,
and streamlines are independently toggleable.

## Architecture

```
src/
  app/                     Next.js App Router shell (layout + page)
  components/
    SimulatorRoot.tsx      Page chrome (header + footer) + 2D/3D dispatch
    SettingsPanel.tsx      ⚙ popover: 2D/3D mode + language + theme (in the header)
    Simulator.tsx          2D: top-level state + worker plumbing
    Canvas.tsx             480×480 canvas, paint + touch + hover + trace input
    Surface3D.tsx          2D-mode optional Three.js mesh of V(x, y)
    Surface3DDynamic.tsx   Next dynamic-import wrapper around Surface3D
    Toolbar.tsx            2D tool picker, voltage / brush / paint-phase
    PresetSelect.tsx       Dropdown of the nine 2D preset geometries
    DisplayToggles.tsx     2D per-layer checkboxes (heatmap / equipotentials /
                           streamlines / arrows / 3D surface)
    RunControls.tsx        Calcular / Paso / Reset V / Limpiar / grid size / boundary
    ACControls.tsx         AC enable + period + live ωt / sin(ωt) readout
    ExportControls.tsx     Save-load + PNG export buttons
    SaveLoadDialog.tsx     localStorage manager + JSON import/export
    Legend.tsx             Colormap legend + conductor color key
    TraceChart.tsx         V(s) / |E|(s) profile chart (2+ point trace)
    StripChart.tsx         AC sin(ωt) waveform + probe V(t) / |E|(t)
                           scrolling 10-s strip chart (1-point trace)
    Simulator3D.tsx        3D: top-level state + worker plumbing
    Toolbar3D.tsx          3D primitive picker, voltage / thickness / radius / slice axis
    Viewport3D.tsx         r3f canvas: voxel instances + slice plane + 3D streamlines
    Viewport3DDynamic.tsx  Next dynamic-import wrapper around Viewport3D
    MethodExplanation.tsx  Footer block with relaxation / trace / AC notes
    ProjectCredits.tsx     Page <footer> with course / team credits
    GitHubLink.tsx         Repo link
  lib/
    grid.ts                GridState, idx, paintBrush/Stroke, applyModulatedFixed
    relaxation.ts          relaxStep (2D SOR sweep), DEFAULT_SOLVER_CONFIG
    rendering.ts           Heatmap / equipotentials / arrows / streamlines / trace
    sampling.ts            sampleV, sampleE, sampleTrace (bilinear interp)
    chartUtils.ts          niceTicks, formatNum (shared by Trace + StripChart)
    colormap.ts            Divergent blue-white-red lerp
    presets.ts             2D geometry helpers + registry (nine presets)
    storage.ts             localStorage + JSON import/export
    grid3d.ts              Grid3DState, idx3, applyBoundary3D / applyFixedValues3D
    relaxation3d.ts        relaxStep3D (6-neighbor SOR), DEFAULT_SOLVER_CONFIG_3D
    rendering3d.ts         sampleSlice, paintSliceRGBA, marching-squares contours,
                           computeStreamlines3D (full-volume 3D field lines)
    primitives3d.ts        Voxel rasterizers (wire / plate / sphere / cylinder)
    presets3d.ts           3D geometry registry (six presets)
  workers/
    solver.worker.ts       2D SOR loop + AC phase accumulator
    solver3d.worker.ts     3D SOR loop (no AC)
  contexts/
    LanguageContext.tsx    ES / EN translations + provider
  types/
    index.ts               2D shape types (GridState, AcConfig, TraceShape, ...)
    worker.ts              2D worker message protocol
    grid3d.ts              3D shape types (Grid3DState, Primitive3D, Tool3D, SliceAxis)
    worker3d.ts            3D worker message protocol
```

The **solver runs in a Web Worker** for both modes. Each worker holds
its own copy of the field arrays and emits transferable `Float32Array`
snapshots of `V` to the main thread every few iterations. Painting
during a run sends `updateFixed` messages so the worker re-applies
fixed values between sweeps without restarting the loop. In 2D,
`setAC` toggles AC mode and tweaks the period mid-flight, and the
worker streams `acPhaseRad` along with each progress event. A
`runToken` counter cancels stale loop iterations after `pause` /
`reset` / `init`, so there are no orphaned progress messages.

## Performance

Target budget on a modern laptop:

| Grid | SOR iteration | Time to converge | Render frame |
| ---- | ------------: | ---------------: | -----------: |
| 80²  |        < 1 ms |         < 100 ms |       < 8 ms |
| 150² |        < 3 ms |         < 500 ms |      < 15 ms |
| 200² |        < 6 ms |          < 1.5 s |      < 25 ms |

If 80² doesn't converge in under 100 ms there's an allocation inside
the hot loop somewhere — start by checking `lib/relaxation.ts`.

## Tech stack

- Next.js 16 (App Router + Turbopack, the default bundler in v16)
- React 19, TypeScript strict + `noUncheckedIndexedAccess`
- Tailwind CSS v4 via `@tailwindcss/postcss`
- Canvas 2D for the 2D heatmap / equipotentials / arrows / streamlines
- Three.js (via `@react-three/fiber` + `@react-three/drei`) only for the
  optional 3D surface view; loaded with `next/dynamic` so the 2D-only
  bundle stays light
- Web Worker for the solver, transferable `Float32Array` / `Uint8Array`
  for zero-copy progress streaming
- `localStorage` for persistence; `canvas.toBlob` for PNG export
- Vercel Analytics (`@vercel/analytics`, mounted as `<Analytics />` in
  `layout.tsx`)
- Vitest for unit tests over `src/lib/*`

## Deploy

The project is configured for static export
(`output: "export"` in `next.config.ts`). After `npm run build`, upload
the contents of `out/` to any static host: Vercel, Cloudflare Pages,
GitHub Pages, Netlify, S3 + CloudFront, etc.

Vercel one-line:

```bash
vercel --prod
```

## Limitations

- No magnetic media.
- Fixed-step square grid / cubic voxel grid (no adaptive refinement).
- Laplace only — no charge density `ρ` (no Poisson equation support).
- Uniform permittivity (no dielectric regions).
- AC modulation is 2D-only.

## License

MIT.
