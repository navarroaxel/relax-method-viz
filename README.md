# Electrostatic Field Simulator — Relaxation Method

A client-side web app that visualizes the 2D electrostatic field by solving
Laplace's equation `∇²V = 0` with successive over-relaxation (SOR) on an
80×80 grid. Draw conductors by hand or load classic textbook geometries,
watch the potential, equipotentials, and field vectors develop in real
time as the solver converges.

## Features

- **Six built-in geometries**: parallel plates, dipole, lightning rod,
  square coaxial, Faraday cage, tip-vs-plane.
- **Freehand drawing**: paint conductors with four tools (`+V`, `−V`,
  ground, erase), adjustable voltage (10–100) and brush size (1–6),
  mouse and touch supported.
- **Three visualization layers**: potential heatmap (divergent
  blue-white-red colormap), equipotential lines (marching squares), and
  electric-field arrows (`E = −∇V` via centered differences). Each
  layer toggles independently.
- **Live solver**: SOR (`ω ≈ 1.9`) runs in a dedicated **Web Worker** so
  the UI never blocks. Iteration count and `Δmax` update in real time;
  the loop stops automatically at `Δmax < 10⁻³`.
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

1. Pick a tool (`+V`, `−V`, `Tierra`, or `Borrar`) and a voltage / brush
   size.
2. Either draw conductors on the canvas or select a preset from the
   **Preset** dropdown to load a textbook geometry.
3. Press **Calcular** to start the solver. The heatmap, equipotentials,
   and arrows update at ~60 fps as SOR sweeps iterate in the worker.
4. **Pausar** stops the loop, **Paso (50)** advances a fixed number of
   iterations synchronously, **Reset V** zeros the potential while
   keeping conductors, **Limpiar** wipes everything.
5. **Guardar / Cargar** opens the persistence dialog (save by name,
   delete, import/export JSON). **Exportar PNG** downloads the current
   canvas as `campo.png`.
6. Hover over any cell to read its grid coordinates, potential `V`, and
   field magnitude `|E|` from a small overlay in the canvas corner.

## Presets

| Preset             | What you should see after **Calcular**                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| Placas paralelas   | Linear `V` between the plates; uniform vertical `E`.                                               |
| Dipolo             | Cardioid-shaped equipotentials; field lines bending from `+` to `−`.                               |
| Pararrayos + nube  | Equipotentials compress sharply near the rod tip — the "lightning rod effect".                    |
| Coaxial cuadrado   | Concentric square equipotentials; radial field outward from the inner conductor.                    |
| Jaula de Faraday   | `V ≈ 0` and no arrows inside the closed shell, even with an external charge — the cage screens.   |
| Punta vs plano    | Equipotential density far higher near the tip than near the flat plate.                            |

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
`2 / (1 + π / N)` — about `1.924` for `N = 80`. We use `ω = 1.9` as a
safe default. The stopping criterion is `Δmax = max |V_new − V_old| <
10⁻³`, typically reached in under 400 iterations on 80².

The field is recovered from the converged potential by centered
differences:

```
Ex = −(V[i+1,j] − V[i−1,j]) / 2
Ey = −(V[i,j+1] − V[i,j−1]) / 2
```

## Rendering layers

- **Heatmap**: a 80×80 `ImageData` colored with a divergent
  blue-white-red colormap (`−Vmax → 0 → +Vmax`), then bilinearly
  upscaled onto the 480×480 display canvas.
- **Equipotentials**: 13 levels equispaced in `[−Vmax, +Vmax]` excluding
  zero. Marching squares with mean-of-corners disambiguation for
  saddles.
- **Field arrows**: sub-grid sampling every 5 cells. Arrow length
  scales as `sqrt(|E| / Emax)`, oriented by `atan2(Ey, Ex)`, with a
  triangular head.
- **Conductors** are painted last, opaquely (`#791F1F` for `+V`,
  `#0C447C` for `−V`, `#2C2C2A` for ground).

## Architecture

```
src/
  app/                     Next.js App Router shell (layout + page)
  components/
    Simulator.tsx          Top-level state + worker plumbing
    Canvas.tsx             480×480 canvas, paint + touch + hover
    Toolbar.tsx            Tool picker, voltage / brush sliders
    PresetSelect.tsx       Dropdown of six preset geometries
    DisplayToggles.tsx     Layer visibility checkboxes
    RunControls.tsx        Calcular / Paso / Reset V / Limpiar
    ExportControls.tsx     Save-load + PNG export buttons
    SaveLoadDialog.tsx     localStorage manager + JSON import/export
    Legend.tsx             Colormap legend + conductor color key
  lib/
    grid.ts                GridState, idx, paintBrush/Stroke
    relaxation.ts          relaxStep (SOR sweep), DEFAULT_SOLVER_CONFIG
    rendering.ts           Heatmap / equipotentials / arrows / conductors
    colormap.ts            Divergent blue-white-red lerp
    presets.ts             Six geometry helpers + registry
    storage.ts             localStorage + JSON import/export
  workers/
    solver.worker.ts       SOR loop, runs off the main thread
  types/
    index.ts               Shared shape types
    worker.ts              Worker message protocol
```

The **solver runs in a Web Worker**. The worker holds its own
`V / fixed / Vfix` and emits transferable `Float32Array` snapshots of
`V` to the main thread every few iterations. Painting during a run
sends `updateFixed` messages so the worker re-applies fixed values
between sweeps without restarting the loop. A `runToken` counter
cancels stale loop iterations after `pause` / `reset` / `init`, so
there are no orphaned progress messages.

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
- Canvas 2D API only — no Three.js, no WebGL, no D3
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
- Laplace only — no charge density `ρ` (Poisson is in `TASK.md §17` as
  a future extension).
- Uniform permittivity (no dielectric regions).
- Grid size is fixed in `Simulator.tsx` at `GRID_N = 80`; the solver
  itself supports arbitrary `N`.

## License

MIT.
