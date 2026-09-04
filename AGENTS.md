<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Commands

```bash
npm run dev       # dev server at http://localhost:3000 (Turbopack)
npm run build     # static export to out/
npm run lint      # ESLint
npm test          # vitest run — unit tests under src/**/*.test.ts (currently only src/lib/)
npm run test:watch # vitest in watch mode
```

Type-check with:

```bash
npx tsc --noEmit
```

## Architecture

**Stack**: Next.js 16 (App Router, static export), React 19, TypeScript strict + `noUncheckedIndexedAccess`, Tailwind CSS v4, Vitest for unit tests. The entire build output is a static `out/` directory — no server runtime.

**App shell**: `SimulatorRoot.tsx` owns the page chrome — the `<main>` wrapper, the header (title, description, GitHub link + `SettingsPanel` popover that holds the 2D/3D mode, language, and theme controls), and the footer (`MethodExplanation`, `ProjectCredits`). It reads `relax-viz:mode` (`"2d" | "3d"`) from `localStorage` via `useSyncExternalStore` (SSR defaults to `"2d"` to match the static export) and renders either `<Simulator />` or `<Simulator3D />` between the header and footer — both are fragments, so their children become siblings of the shared chrome.

**Grid indexing**:

- 2D: `idx(i, j, N) = i * N + j` where `i` is column (x, rightward) and `j` is row (y, downward). This is column-major; `ImageData` is row-major `(y * N + x) * 4`, so heatmap rendering iterates `(y, x)` rather than `(i, j)`.
- 3D: `idx3(i, j, k, N) = (i * N + j) * N + k` — `k` varies fastest in memory. `(i, j, k)` maps to world space as `i → x` (rightward), `j → y` (up), `k → z` (toward camera).

**Solver / main thread split**: `Simulator.tsx` owns all React state and spawns `solver.worker.ts` via `new Worker(new URL(...), { type: "module" })`. The worker owns its own copy of `V / fixed / Vfix / phase` and streams transferable `Float32Array` snapshots back on every `reportEvery` (5) iterations. The worker's `runToken` counter is incremented on every `pause / reset / init` to cancel stale `setTimeout` loop iterations — this is the only concurrency guard. `Simulator3D.tsx` follows the identical pattern with `solver3d.worker.ts` (`reportEvery = 2` since each 3D sweep is heavier) but has no AC plumbing.

**Painting during a run**: `Canvas.tsx` calls `paintBrush` / `paintStroke` on the main-thread `GridState`, then `Simulator` sends an `updateFixed` message (with transferable copies of `fixed` / `Vfix` / `phase`) so the worker picks up the new conductor layout between sweeps, without restarting.

**Worker message protocol** (`src/types/worker.ts` — 2D):

- Inbound: `init | run | pause | reset | step | updateFixed | setAC`
- Outbound: `progress | done` — both carry a transferable `V: Float32Array` snapshot **and** the current `acPhaseRad` (radians) so the main thread can render AC-aware UI

**3D worker message protocol** (`src/types/worker3d.ts`):

- Inbound: `init | run | pause | reset | step | updateFixed` (no AC)
- Outbound: `progress | done` — transferable `V: Float32Array` snapshot of the full `N³` field

**AC modulation** (`src/lib/grid.ts:applyModulatedFixed`): each cell of `GridState` has a `phase: Float32Array` (radians, set per-cell when painting). When AC is enabled, every fixed cell is overwritten before each `relaxStep` with `Vfix[k] * sin(omegaT + phase[k])`. The worker accumulates `acPhaseRad` from wall-clock (`performance.now()` delta) only while running — pausing freezes the AC angle so the wave doesn't jump on resume. While AC is active the convergence / `maxIterations` stops are skipped: the field never settles, the user pauses manually.

**Trace + probe** (`src/lib/sampling.ts`): the `TraceShape` polyline is built by the line/curve tools in `Canvas.tsx` and behaves two ways based on `points.length`. With **2+ points** it's a spatial profile — `sampleTrace()` walks it with uniform arc-length step and `TraceChart.tsx` plots `V(s)` and `|E|(s)`. With **1 point** it's a probe: on every worker progress event `Simulator` calls `sampleV` + `sampleE` at that grid coordinate and pushes `(performance.now(), V, |E|)` into a ring buffer (`StripChart.makeProbeHistory`, capped at 2048 samples / 10 s window); `StripChart` in `"probe"` mode renders the scrolling time series. A second `StripChart` in `"ac"` mode draws the analytic `sin(ωt − 2π·Δt/period)` over the same 10-s window whenever AC is enabled — no buffer needed, the curve is a pure function of `acPhaseRad` + `periodSec`.

**To drop a probe via the line tool**: click twice on the same cell (second click within ~0.5 cells of the first commits a 1-point trace instead of a degenerate 2-point line). The free-curve tool commits a probe when mousedown happens with no drag.

**Rendering** — two pipelines in 2D mode, both driven by the same `renderTick`:

- 2D (`src/lib/rendering.ts`): Canvas 2D only. Heatmap draws an `N×N` `ImageData` into an off-screen buffer then `drawImage`-scales it to 480×480. Equipotentials use marching squares. Field arrows sub-sample every 5 cells and scale length as `sqrt(|E| / Emax)`. Streamlines (`renderStreamlines`) seed on a uniform sub-grid and trace RK2 through a bilinearly sampled field; **arrows and streamlines are mutually exclusive** (enforced in `DisplayToggles.tsx`).
- 2D `Surface3D` overlay (`src/components/Surface3D.tsx`, lazy-loaded via `Surface3DDynamic.tsx` + `next/dynamic`): Three.js via `@react-three/fiber` + `@react-three/drei`. One vertex per grid cell on a `PlaneGeometry`; per-vertex height `v / vmax` and per-vertex color from the same `divergentColor`. WebGL only loads when `display.surface3D` is on.

**3D rendering** (`src/components/Viewport3D.tsx`, lazy via `Viewport3DDynamic.tsx`): single R3F canvas with `OrbitControls`. The domain is a wireframe `[-0.5, 0.5]³` cube. Three child pieces:

- `VoxelInstances`: `InstancedMesh` of boxGeometry, one instance per fixed cell, colored with `divergentColor(Vfix, vmaxFixed)` (ground cells gold). Capped at `MAX_INSTANCES = 80_000`; rebuilds only when `conductorVersion` bumps (painted-primitive commits, presets, clear) — _not_ on `renderTick`.
- `SlicePlane`: a `PlaneGeometry` textured by a `CanvasTexture` of the chosen axis-perpendicular slice through `V`, plus optional black contour overlay (marching-squares of the same slice). Repainted every `renderTick`.
- `FieldLines`: full-volume 3D streamlines from `computeStreamlines3D(grid)` into a 1.2M-float pre-allocated buffer (`LineSegments`); repainted every `renderTick`. Hidden when toggled off.

**3D primitive placement** (`src/lib/primitives3d.ts` + `Viewport3D.tsx`): five tools — `wire | plate | sphere | cylinder | era`. Two-click model on the slice plane: first pointerdown anchors a cell, second pointerdown commits a `Primitive3D` via `onCommitPrimitive`; `Escape` cancels. `OrbitControls` is disabled while an anchor is pending so dragging doesn't fight with line-drawing. The cell-to-world projection uses the slice's `axisIndex` for the locked coordinate; the other two come from the world hit point on the slice plane. **All endpoints are clamped to the interior `[1, N-2]`** before commit so primitives never land on the Neumann boundary row that `applyBoundary3D` would overwrite. The `plate` tool extends by `±thickness/2` along the slice-normal axis; `sphere` derives its radius from the distance between the two clicks; `cylinder` uses the standalone `radius` slider.

**Boundary conditions**:

- 2D (`src/lib/grid.ts:applyBoundary`): outer-wall BC type lives on `GridState.boundary` and is **Neumann by default** (ghost-cell mirror — corners copy diagonally). Dirichlet (V=0 at all four edges) is available via the `Contorno` selector but is physically incorrect for the textbook cases shipped here (walls are not conductors). `applyBoundary` runs at the top of every `relaxStep` and **does not re-assert fixed cells on the edge row/column** — keep conductors off rows/cols 0 and N−1.
- 3D (`src/lib/grid3d.ts:applyBoundary3D`): Neumann only — each of the six faces copies its inward neighbor. No Dirichlet UI. Same caveat: `relaxStep3D` iterates `[1, N-2]³` and `applyBoundary3D` does not re-assert fixed cells on the faces, so primitive endpoints are clamped at placement time.

**Key constants**:

- 2D (`Simulator.tsx`): grid 80/120/200, ω 1.0–1.999, `DISPLAY_SIZE = 480`, `MANUAL_STEP = 50`. `DEFAULT_SOLVER_CONFIG` in `src/lib/relaxation.ts`: ω = 1.9, tolerance = 1e-3, maxIterations = 2000, reportEvery = 5.
- 3D (`Simulator3D.tsx`): grid 40/60/80 (cubes, default 60), ω 1.0–1.99, `MANUAL_STEP = 20`. `DEFAULT_SOLVER_CONFIG_3D` in `src/lib/relaxation3d.ts`: ω = 1.9, tolerance = 1e-3, maxIterations = 2000, reportEvery = 2 (each 3D sweep touches `(N-2)³` cells with a 6-neighbor stencil, so we report twice as often per wall-second).

**Path alias**: `@/` maps to `src/`.

**Presets (2D)** (`src/lib/presets.ts`): Ten entries in `PRESETS: Record<PresetId, Preset>`, rendered in the order defined by `PRESET_ORDER`. Each `apply(g)` calls `clearAll`, then geometry helpers (`setRect`, `setDisc`, `setRing`, `setTriangleTipUp`), then `applyFixedValues`. All coordinates are written for N = 80 and scaled via `sc = (x) => Math.round(x * g.N / 80)` so they adapt to any grid size.

| ID                | Label                    | Geometry                                                                                    |
| ----------------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| `parallel`        | Capacitor plano          | Two horizontal strips at ±100 kV                                                            |
| `dipole`          | Dipolo                   | Two discs at ±100 kV, centred left/right                                                    |
| `lightning`       | Pararrayos simplificado  | Top plate +100 kV, grounded bottom plate + grounded rod                                     |
| `coaxial`         | Cable Coaxial            | Grounded outer ring + central disc at +80 V                                                 |
| `faraday`         | Jaula de Faraday         | Top plate +80 V, grounded bottom plate + grounded closed box                                |
| `tip`             | Punta vs plano           | Grounded bottom plate + triangular tip at +80 V                                             |
| `conductors`      | Placas conductoras       | Horizontal plate +100 kV + vertical plate −100 kV (L-shape)                                 |
| `singleconductor` | Línea 1 conductor        | Ground plane + single central disc at √(2/3)×500 kV                                         |
| `subconductors`   | Línea 4 subconductores   | Ground plane + 2×2 disc bundle at √(2/3)×500 kV                                             |
| `threephase`      | Línea trifásica + neutro | Ground plane + 3 discs at √(2/3)×500 kV, AC phases 0°/120°/240° + 1 grounded (neutral) disc |

**Presets (3D)** (`src/lib/presets3d.ts`): Six entries in `PRESETS_3D: Record<Preset3DId, Preset3D>`. Each `apply(g)` calls `clearAll3D`, then voxel rasterizers from `src/lib/primitives3d.ts` (presets currently use `rasterPlate` and `rasterCylinder`; `rasterSphere` and `rasterWire` are available for the toolbar tools but no preset needs them). All coordinates are written for `REF_N = 60` and scaled via `sc = (x, N) => Math.round(x * N / 60)`. There is no `tip` or `conductors` analogue in 3D.

| ID              | Label                        | Geometry                                                          |
| --------------- | ---------------------------- | ----------------------------------------------------------------- |
| `parallel`      | Placas paralelas (3D)        | Two horizontal slabs at ±100 V, perpendicular to Y                |
| `dipole`        | Dipolo (3D)                  | Two small ±100 V slabs on opposite sides of the cube              |
| `coax`          | Cable coaxial (3D)           | Grounded outer cylinder + inner conductor at +80 V along an axis  |
| `lightning`     | Pararrayos simplificado (3D) | Top plate +100 kV + grounded bottom plate + grounded vertical rod |
| `faraday`       | Jaula de Faraday (3D)        | Driven plate + grounded plate + grounded closed box               |
| `subconductors` | Línea 4 subconductores (3D)  | Ground plane + 2×2 cylinder bundle at √(2/3)×500 kV               |

## Lab pages (`/lab1`, `/lab2`)

Two standalone routes — `src/app/lab1/` and `src/app/lab2/` — are static write-ups of two real bench experiments (Cátedra Teoría de los Campos, UTN.BA), independent of the relaxation-method simulator. Each is a single client page (`Lab1Page.tsx` / `Lab2Page.tsx`) built from real CASSY-logged datasets baked in as `Float64Array`s, not simulated. `page.tsx` in each route only sets `metadata` and renders the page component.

- **Copy lives next to the route, not in `LanguageContext`**: `src/app/lab1/copy.ts` / `src/app/lab2/copy.ts` export `LAB{1,2}_COPY: Record<Language, Lab{1,2}Copy>` — long-form ES/EN prose (goals, setup steps, per-section analysis, conclusions) plus the typed labels for that lab's diagrams. `LanguageContext` itself only holds the short strings shared by the simulator chrome.
- **Lab 1** (`src/app/lab1/`) — solenoid force experiment: a loop of known current `I` is lowered into a solenoid's field and `B` is recovered from `B = F/(I·l)`. Four independent measurement routes cross-check the same `B`:
  - `lib/lab1Escalon.ts` — 1 ms-sampled current-step capture; `analyzeStep` extracts rise time, overshoot, settling time, damping ratio from the sensor's underdamped mechanical response (not field physics).
  - `lib/lab1MedicionContinua.ts` — continuous hand-swept ramp (0.1 s samples); `analyzeRamp` fits F vs I separately on the rising/falling branches and quantifies the hysteresis loop, `predictFromStepResponse` cross-checks how much of it the step response's own lag explains.
  - `lib/lab1MedicionIndirecta.ts` — 4 independent point-by-point sessions (`analyzeIndirectSession` fits a robust Theil–Sen line per session and flags outliers by MAD).
  - `lib/lab1MedicionDirecta.ts` — 14-point Hall-probe traverse (center / end / outside the coil) confirming the field is axial and halves at the coil ends.
  - `lib/lab1Solenoid.ts` computes the ideal-solenoid theoretical field (`B = μ₀·n·I`) for comparison; `lib/lab1FieldSummary.ts` averages the routes and reports the spread as the error bar.
  - Diagrams: `Lab1Diagram.tsx` (animated bench replaying the real step/ramp captures), `Lab1CompassDiagram.tsx` (qualitative compass-needle sketch), `Lab1DirectDiagram.tsx` (Hall-probe traverse positions), `Lab1IndirectChart.tsx` (per-session F vs I with outliers marked).
- **Lab 2** (`src/app/lab2/`) — permeability of free space: two parallel current-carrying conductors, `μ₀ = 2π·F·r/(I²·l)` from the fitted slope of F vs I².
  - `lib/lab2Geometria.ts` — hand-measured bench dimensions (lengths, diameters, separation `r`); models the bench as three conductors (not the guide's idealized two), computing `mu0FromSlopeIdeal` vs `mu0FromSlopeCorrected` and the per-term relative-error budget (`errorTerms`) across the current range.
  - `lib/lab2Curvas.ts` — three stepped F(I) runs, `fitQuadratic` fits F = a·I² + b per run and checks slope agreement across runs.
  - `lib/lab2Rampa.ts` — continuous up/down sweep; `fitBranch` + hysteresis gap between rising/falling branches.
  - `lib/lab2Escalon.ts` — 1 ms current-step capture, same underdamped-sensor analysis pattern as Lab 1's step.
  - Diagrams: `Lab2Diagram.tsx` (cross-section showing the extra loop-return conductor pair the ideal two-wire model ignores), `Lab2CircuitDiagram.tsx` (animated bench replaying real step/ramp captures), `Lab2CurvesChart.tsx` (three F(I) runs, linearizable to F vs I²), `Lab2ErrorChart.tsx` (stacked per-term error-budget chart vs current).
- **Shared chart components** (`src/components/LabTimeChart.tsx`, `LabXYChart.tsx`) are generic Canvas2D time-series / XY plotters used by both labs' step/ramp/curve charts — analogous to `TraceChart`/`StripChart` in the simulator but lab-specific and dependency-free of the grid/worker machinery.
- Every `lib/lab{1,2}*.ts` module has a matching `*.test.ts` — these are the bulk of the Vitest suite alongside the simulator's own `src/lib/*.test.ts`.
- `SimulatorRoot.tsx`'s header links out to both `/lab1` and `/lab2` (`page.lab1_link` / `page.lab2_link` keys in `LanguageContext`); each lab page links back to the simulator and to the other lab via its own `backToSim` / `backToLab1` / `toLab2` copy strings.
