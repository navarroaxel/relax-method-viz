<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Commands

```bash
npm run dev       # dev server at http://localhost:3000 (Turbopack)
npm run build     # static export to out/
npm run lint      # ESLint
```

There is no test suite. Type-check with:

```bash
npx tsc --noEmit
```

## Architecture

**Stack**: Next.js 16 (App Router, static export), React 19, TypeScript strict + `noUncheckedIndexedAccess`, Tailwind CSS v4. No testing framework. The entire build output is a static `out/` directory — no server runtime.

**Grid indexing**: `idx(i, j, N) = i * N + j` where `i` is column (x, rightward) and `j` is row (y, downward). This is column-major; `ImageData` is row-major `(y * N + x) * 4`, so heatmap rendering iterates `(y, x)` rather than `(i, j)`.

**Solver / main thread split**: `Simulator.tsx` owns all React state and spawns `solver.worker.ts` via `new Worker(new URL(...), { type: "module" })`. The worker owns its own copy of `V / fixed / Vfix / phase` and streams transferable `Float32Array` snapshots back on every `reportEvery` (5) iterations. The worker's `runToken` counter is incremented on every `pause / reset / init` to cancel stale `setTimeout` loop iterations — this is the only concurrency guard.

**Painting during a run**: `Canvas.tsx` calls `paintBrush` / `paintStroke` on the main-thread `GridState`, then `Simulator` sends an `updateFixed` message (with transferable copies of `fixed` / `Vfix` / `phase`) so the worker picks up the new conductor layout between sweeps, without restarting.

**Worker message protocol** (`src/types/worker.ts`):
- Inbound: `init | run | pause | reset | step | updateFixed | setAC`
- Outbound: `progress | done` — both carry a transferable `V: Float32Array` snapshot **and** the current `acPhaseRad` (radians) so the main thread can render AC-aware UI

**AC modulation** (`src/lib/grid.ts:applyModulatedFixed`): each cell of `GridState` has a `phase: Float32Array` (radians, set per-cell when painting). When AC is enabled, every fixed cell is overwritten before each `relaxStep` with `Vfix[k] * sin(omegaT + phase[k])`. The worker accumulates `acPhaseRad` from wall-clock (`performance.now()` delta) only while running — pausing freezes the AC angle so the wave doesn't jump on resume. While AC is active the convergence / `maxIterations` stops are skipped: the field never settles, the user pauses manually.

**Trace + probe** (`src/lib/sampling.ts`): the `TraceShape` polyline is built by the line/curve tools in `Canvas.tsx` and behaves two ways based on `points.length`. With **2+ points** it's a spatial profile — `sampleTrace()` walks it with uniform arc-length step and `TraceChart.tsx` plots `V(s)` and `|E|(s)`. With **1 point** it's a probe: on every worker progress event `Simulator` calls `sampleV` + `sampleE` at that grid coordinate and pushes `(performance.now(), V, |E|)` into a ring buffer (`StripChart.makeProbeHistory`, capped at 2048 samples / 10 s window); `StripChart` in `"probe"` mode renders the scrolling time series. A second `StripChart` in `"ac"` mode draws the analytic `sin(ωt − 2π·Δt/period)` over the same 10-s window whenever AC is enabled — no buffer needed, the curve is a pure function of `acPhaseRad` + `periodSec`.

**To drop a probe via the line tool**: click twice on the same cell (second click within ~0.5 cells of the first commits a 1-point trace instead of a degenerate 2-point line). The free-curve tool commits a probe when mousedown happens with no drag.

**Rendering** — two pipelines, both driven by the same `renderTick`:
- 2D (`src/lib/rendering.ts`): Canvas 2D only. Heatmap draws an `N×N` `ImageData` into an off-screen buffer then `drawImage`-scales it to 480×480. Equipotentials use marching squares. Field arrows sub-sample every 5 cells and scale length as `sqrt(|E| / Emax)`. Streamlines (`renderStreamlines`) seed on a uniform sub-grid and trace RK2 through a bilinearly sampled field; **arrows and streamlines are mutually exclusive** (enforced in `DisplayToggles.tsx`).
- 3D (`src/components/Surface3D.tsx`, lazy-loaded via `Surface3DDynamic.tsx` + `next/dynamic`): Three.js via `@react-three/fiber` + `@react-three/drei`. One vertex per grid cell on a `PlaneGeometry`; per-vertex height `v / vmax` and per-vertex color from the same `divergentColor`. WebGL only loads when `display.surface3D` is on.

**Boundary conditions** (`src/lib/grid.ts:applyBoundary`): outer-wall BC type lives on `GridState.boundary` and is **Neumann by default** (ghost-cell mirror — corners copy diagonally). Dirichlet (V=0 at all four edges) is available via the `Contorno` selector but is physically incorrect for the textbook cases shipped here (walls are not conductors). `applyBoundary` runs at the top of every `relaxStep` and **does not re-assert fixed cells on the edge row/column** — keep conductors off rows/cols 0 and N−1.

**Key constants** (all in `Simulator.tsx`):
- Grid size (N) and ω are runtime state — user-selectable via the UI controls (grid: 80/120/200, ω: 1.0–1.999)
- `DISPLAY_SIZE = 480` — canvas pixel size
- `MANUAL_STEP = 50` — iterations per "Paso" button press
- `DEFAULT_SOLVER_CONFIG` in `src/lib/relaxation.ts`: ω = 1.9, tolerance = 1e-3, maxIterations = 2000, reportEvery = 5

**Path alias**: `@/` maps to `src/`.

**Presets** (`src/lib/presets.ts`): Eight entries in `PRESETS: Record<PresetId, Preset>`, rendered in the order defined by `PRESET_ORDER`. Each `apply(g)` calls `clearAll`, then geometry helpers (`setRect`, `setDisc`, `setRing`, `setTriangleTipUp`), then `applyFixedValues`. All coordinates are written for N = 80 and scaled via `sc = (x) => Math.round(x * g.N / 80)` so they adapt to any grid size.

| ID             | Label                    | Geometry                                                        |
| -------------- | ------------------------ | --------------------------------------------------------------- |
| `parallel`     | Capacitor plano          | Two horizontal strips at ±100 kV                               |
| `dipole`       | Dipolo                   | Two discs at ±100 kV, centred left/right                       |
| `lightning`    | Pararrayos simplificado  | Top plate +100 kV, grounded bottom plate + grounded rod        |
| `coaxial`      | Cable Coaxial            | Grounded outer ring + central disc at +80 V                    |
| `faraday`      | Jaula de Faraday         | Top plate +80 V, grounded bottom plate + grounded closed box   |
| `tip`          | Punta vs plano           | Grounded bottom plate + triangular tip at +80 V                |
| `conductors`   | Placas conductoras       | Horizontal plate +100 kV + vertical plate −100 kV (L-shape)   |
| `subconductors`| Línea 4 subconductores   | Ground plane + 2×2 disc bundle at √(2/3)×500 kV               |
