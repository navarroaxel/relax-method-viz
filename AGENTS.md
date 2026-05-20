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

**Solver / main thread split**: `Simulator.tsx` owns all React state and spawns `solver.worker.ts` via `new Worker(new URL(...), { type: "module" })`. The worker owns its own copy of `V / fixed / Vfix` and streams transferable `Float32Array` snapshots back on every `reportEvery` (5) iterations. The worker's `runToken` counter is incremented on every `pause / reset / init` to cancel stale `setTimeout` loop iterations — this is the only concurrency guard.

**Painting during a run**: `Canvas.tsx` calls `paintBrush` / `paintStroke` on the main-thread `GridState`, then `Simulator` sends an `updateFixed` message (with transferable copies of `fixed` / `Vfix`) so the worker picks up the new conductor layout between sweeps, without restarting.

**Worker message protocol** (`src/types/worker.ts`):
- Inbound: `init | run | pause | reset | step | updateFixed`
- Outbound: `progress | done` — both carry a transferable `V: Float32Array` snapshot

**Rendering** (`src/lib/rendering.ts`): all Canvas 2D, no WebGL. Heatmap draws an `N×N` `ImageData` into an off-screen buffer then `drawImage`-scales it to 480×480. Equipotentials use marching squares. Field arrows sub-sample every 5 cells and scale length as `sqrt(|E| / Emax)`.

**Key constants** (all in `Simulator.tsx`):
- Grid size (N) and ω are runtime state — user-selectable via the UI controls (grid: 80/120/200, ω: 1.0–1.999)
- `DISPLAY_SIZE = 480` — canvas pixel size
- `MANUAL_STEP = 50` — iterations per "Paso" button press
- `DEFAULT_SOLVER_CONFIG` in `src/lib/relaxation.ts`: ω = 1.9, tolerance = 1e-3, maxIterations = 2000, reportEvery = 5

**Path alias**: `@/` maps to `src/`.

**Presets** (`src/lib/presets.ts`): Eight entries in `PRESETS: Record<PresetId, Preset>`, rendered in the order defined by `PRESET_ORDER`. Each `apply(g)` calls `clearAll`, then geometry helpers (`setRect`, `setDisc`, `setRing`, `setHollowRect`, `setTriangleTipUp`), then `applyFixedValues`. All coordinates are written for N = 80 and scaled via `sc = (x) => Math.round(x * g.N / 80)` so they adapt to any grid size.

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
