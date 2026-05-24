# Electrostatic Field Simulator — Relaxation Method

A client-side web app that visualizes the 2D electrostatic field by solving
Laplace's equation `∇²V = 0` with successive over-relaxation (SOR) on a
user-selectable grid (80×80, 120×120, or 200×200). Draw conductors by hand
or load classic textbook geometries, watch the potential, equipotentials, and
field vectors develop in real time as the solver converges.

## Features

- **Eight built-in geometries**: flat capacitor, dipole, simplified
  lightning rod, coaxial cable, Faraday cage, tip-vs-plane, L-shaped
  conducting plates, 4-subconductor HV bundle.
- **Freehand drawing**: paint conductors with four tools (`+V`, `−V`,
  ground, erase), voltage preset (100 V / 220 V / 100 kV / √(2/3)×500 kV)
  and brush size (1–6), mouse and touch supported.
- **Four visualization layers**: potential heatmap (divergent
  blue-white-red colormap), equipotential lines (marching squares),
  electric-field arrows (`E = −∇V` via centered differences), and
  field-line streamlines (RK2 integration through the bilinearly
  sampled field). Each layer toggles independently; arrows and
  streamlines are mutually exclusive.
- **Optional 3D surface view**: render `V(x, y)` as a Three.js mesh
  with the same divergent colormap, orbit-controlled camera; runs
  alongside the 2D canvas and updates live as the solver iterates.
- **Live solver**: SOR (`ω ≈ 1.9`) runs in a dedicated **Web Worker** so
  the UI never blocks. Iteration count and `Δmax` update in real time;
  the loop stops automatically at `Δmax < 10⁻³`.
- **Grid size**: switch between 80×80, 120×120, and 200×200 at runtime;
  the **Auto** button recomputes the optimal ω for the current N.
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

Requirements: Node 20+ (Next.js 16), modern browser with Web Worker and
transferable `ArrayBuffer` support.

## Using the app

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

## Presets

| Preset ID        | Label                     | What you should see after **Calcular**                                                          |
| ---------------- | ------------------------- | ------------------------------------------------------------------------------------------------ |
| `parallel`       | Capacitor plano           | Linear `V` between the plates; uniform vertical `E` (textbook parallel-plate capacitor).        |
| `dipole`         | Dipolo                    | Cardioid-shaped equipotentials; field lines curving from `+` disc to `−` disc.                  |
| `lightning`      | Pararrayos simplificado   | Top plate at +100 kV, grounded rod below — equipotentials compress sharply near the rod tip.    |
| `coaxial`        | Cable Coaxial             | Concentric circular equipotentials; radial field outward from the inner disc.                    |
| `faraday`        | Jaula de Faraday          | `V ≈ 0` and no arrows inside the grounded closed box, even with an external field — cage screens. |
| `tip`            | Punta vs plano            | Triangular tip at +80 V over a grounded plate — high field density near the apex.               |
| `conductors`     | Placas conductoras        | L-shaped geometry (horizontal +100 kV plate, vertical −100 kV plate); fringe fields at edges.  |
| `subconductors`  | Línea 4 subconductores    | 2×2 bundle of discs at √(2/3)×500 kV over a ground plane — models a 4-subconductor HV bundle.  |

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
property of harmonic functions).

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

## Architecture

```
src/
  app/                     Next.js App Router shell (layout + page)
  components/
    Simulator.tsx          Top-level state + worker plumbing
    Canvas.tsx             480×480 canvas, paint + touch + hover + trace input
    Surface3D.tsx          Three.js mesh of V(x, y), orbit-controlled
    Surface3DDynamic.tsx   Next dynamic-import wrapper around Surface3D
    Toolbar.tsx            Tool picker, voltage / brush / paint-phase
    PresetSelect.tsx       Dropdown of the eight preset geometries
    DisplayToggles.tsx     Per-layer checkboxes (heatmap / equipotentials /
                           streamlines / arrows / 3D surface)
    RunControls.tsx        Calcular / Paso / Reset V / Limpiar / grid size / boundary
    ACControls.tsx         AC enable + period + live ωt / sin(ωt) readout
    ExportControls.tsx     Save-load + PNG export buttons
    SaveLoadDialog.tsx     localStorage manager + JSON import/export
    Legend.tsx             Colormap legend + conductor color key
    TraceChart.tsx         V(s) / |E|(s) profile chart (2+ point trace)
    StripChart.tsx         AC sin(ωt) waveform + probe V(t) / |E|(t)
                           scrolling 10-s strip chart (1-point trace)
    MethodExplanation.tsx  Footer block with relaxation / trace / AC notes
    ProjectCredits.tsx     Page <footer> with course / team credits
    LanguageToggle.tsx     ES / EN switch (useSyncExternalStore)
    ThemeToggle.tsx        Light / dark / system theme switch
    GitHubLink.tsx         Repo link
  lib/
    grid.ts                GridState, idx, paintBrush/Stroke, applyModulatedFixed
    relaxation.ts          relaxStep (SOR sweep), DEFAULT_SOLVER_CONFIG
    rendering.ts           Heatmap / equipotentials / arrows / streamlines / trace
    sampling.ts            sampleV, sampleE, sampleTrace (bilinear interp)
    chartUtils.ts          niceTicks, formatNum (shared by Trace + StripChart)
    colormap.ts            Divergent blue-white-red lerp
    presets.ts             Geometry helpers + registry
    storage.ts             localStorage + JSON import/export
  workers/
    solver.worker.ts       SOR loop + AC phase accumulator, off the main thread
  contexts/
    LanguageContext.tsx    ES / EN translations + provider
  types/
    index.ts               Shared shape types (GridState, AcConfig, TraceShape, ...)
    worker.ts              Worker message protocol
```

The **solver runs in a Web Worker**. The worker holds its own
`V / fixed / Vfix / phase` and emits transferable `Float32Array`
snapshots of `V` plus the current `acPhaseRad` to the main thread
every few iterations. Painting during a run sends `updateFixed`
messages so the worker re-applies fixed values between sweeps without
restarting the loop; `setAC` toggles AC mode and tweaks the period
mid-flight. A `runToken` counter cancels stale loop iterations after
`pause` / `reset` / `init`, so there are no orphaned progress
messages.

## Performance

Target budget on a modern laptop:

| Grid  | SOR iteration | Time to converge | Render frame |
| ----- | ------------: | ---------------: | -----------: |
| 80²   |        < 1 ms |          < 100 ms |       < 8 ms |
| 150²  |        < 3 ms |          < 500 ms |      < 15 ms |
| 200²  |        < 6 ms |           < 1.5 s |      < 25 ms |

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

- Two-dimensional only; no magnetic media.
- Fixed-step square grid (no adaptive refinement).
- Laplace only — no charge density `ρ` (no Poisson equation support).
- Uniform permittivity (no dielectric regions).

## License

MIT.
