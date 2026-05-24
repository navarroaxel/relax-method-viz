import { divergentColor } from "@/lib/colormap";
import { idx } from "@/lib/grid";
import { sampleEForStreamline } from "@/lib/sampling";
import type { DisplayFlags, GridState } from "@/types";

export interface TraceShape {
  kind: "line" | "curve";
  points: ReadonlyArray<readonly [number, number]>;
}

let heatmapBuffer: HTMLCanvasElement | null = null;
let heatmapBufferN = 0;

function getHeatmapBuffer(N: number): HTMLCanvasElement {
  if (heatmapBuffer === null || heatmapBufferN !== N) {
    heatmapBuffer = document.createElement("canvas");
    heatmapBuffer.width = N;
    heatmapBuffer.height = N;
    heatmapBufferN = N;
  }
  return heatmapBuffer;
}

export interface FieldStats {
  vmax: number; // max |V| over the full grid
  emax: number; // max |E| (central differences) over interior cells
}

// Single-pass field summary. Used by both the rendering pipeline (heatmap /
// equipotentials need vmax) and the trace chart (which needs both as fixed
// axis scales). Returning them together keeps the two ranges tightly aligned
// — they're always computed from the same snapshot of V — and one walk over
// V is cache-friendlier than scanning it twice.
export function computeFieldStats(V: Float32Array, N: number): FieldStats {
  let vmax = 0;
  let emax = 0;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const v = V[idx(i, j, N)] as number;
      const a = v < 0 ? -v : v;
      if (a > vmax) vmax = a;
      // |E| via central differences is only defined on interior cells.
      if (i > 0 && i < N - 1 && j > 0 && j < N - 1) {
        const vR = V[idx(i + 1, j, N)] as number;
        const vL = V[idx(i - 1, j, N)] as number;
        const vD = V[idx(i, j + 1, N)] as number;
        const vU = V[idx(i, j - 1, N)] as number;
        const ex = -(vR - vL) * 0.5;
        const ey = -(vD - vU) * 0.5;
        const m = Math.hypot(ex, ey);
        if (m > emax) emax = m;
      }
    }
  }
  return { vmax: vmax > 0 ? vmax : 1, emax: emax > 0 ? emax : 1 };
}

export function renderHeatmap(
  ctx: CanvasRenderingContext2D,
  V: Float32Array,
  N: number,
  vmax: number,
  outSize: number,
): void {
  const buf = getHeatmapBuffer(N);
  const bufCtx = buf.getContext("2d");
  if (!bufCtx) return;
  const img = bufCtx.createImageData(N, N);
  const data = img.data;
  // ImageData is row-major in screen space: pixel at (x, y) lives at index
  // (y * N + x) * 4. In grid coords (i = x, j = y) that's idx(i, j, N) * 4
  // — but ImageData uses (y, x) ordering, so we need (j, i) iteration.
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const k = idx(x, y, N);
      const v = V[k] as number;
      const [r, g, b] = divergentColor(v, vmax);
      const p = (y * N + x) * 4;
      data[p] = r;
      data[p + 1] = g;
      data[p + 2] = b;
      data[p + 3] = 255;
    }
  }
  bufCtx.putImageData(img, 0, 0);
  const prevSmoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(buf, 0, 0, outSize, outSize);
  ctx.imageSmoothingEnabled = prevSmoothing;
}

function interp(
  vA: number,
  vB: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  L: number,
): [number, number] {
  const denom = vA - vB;
  const t = denom === 0 ? 0.5 : (vA - L) / denom;
  return [ax + t * (bx - ax), ay + t * (by - ay)];
}

export function renderEquipotentials(
  ctx: CanvasRenderingContext2D,
  V: Float32Array,
  N: number,
  vmax: number,
  cellSize: number,
  numLevels = 13,
): void {
  if (vmax <= 0) return;
  const levels: number[] = [];
  for (let k = 1; k <= numLevels; k++) {
    const t = (2 * k) / (numLevels + 1) - 1;
    if (Math.abs(t) < 1e-6) continue;
    levels.push(t * vmax);
  }
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.32)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (const L of levels) {
    drawLevel(ctx, V, N, cellSize, L);
  }
  ctx.stroke();
  ctx.restore();
}

function drawLevel(
  ctx: CanvasRenderingContext2D,
  V: Float32Array,
  N: number,
  cellSize: number,
  L: number,
): void {
  for (let i = 0; i < N - 1; i++) {
    for (let j = 0; j < N - 1; j++) {
      // Corners in screen coords (x = i*cs, y = j*cs):
      //   A = (i, j)       top-left
      //   B = (i+1, j)     top-right
      //   C = (i+1, j+1)   bottom-right
      //   D = (i, j+1)     bottom-left
      const vA = V[idx(i, j, N)] as number;
      const vB = V[idx(i + 1, j, N)] as number;
      const vC = V[idx(i + 1, j + 1, N)] as number;
      const vD = V[idx(i, j + 1, N)] as number;
      let c = 0;
      if (vA > L) c |= 1;
      if (vB > L) c |= 2;
      if (vC > L) c |= 4;
      if (vD > L) c |= 8;
      if (c === 0 || c === 15) continue;
      const ax = i * cellSize;
      const ay = j * cellSize;
      const bx = (i + 1) * cellSize;
      const by = j * cellSize;
      const cx = (i + 1) * cellSize;
      const cy = (j + 1) * cellSize;
      const dx = i * cellSize;
      const dy = (j + 1) * cellSize;
      // Edge crossings (only those whose edge actually changes sign are valid;
      // unused ones are simply not consumed by the case below).
      const e0 = () => interp(vA, vB, ax, ay, bx, by, L); // top
      const e1 = () => interp(vB, vC, bx, by, cx, cy, L); // right
      const e2 = () => interp(vC, vD, cx, cy, dx, dy, L); // bottom (C→D)
      const e3 = () => interp(vD, vA, dx, dy, ax, ay, L); // left  (D→A)
      const seg = (
        a: [number, number],
        b: [number, number],
      ) => {
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
      };
      switch (c) {
        case 1: // A
        case 14: // not A
          seg(e3(), e0());
          break;
        case 2: // B
        case 13: // not B
          seg(e0(), e1());
          break;
        case 4: // C
        case 11: // not C
          seg(e1(), e2());
          break;
        case 8: // D
        case 7: // not D
          seg(e2(), e3());
          break;
        case 3: // A,B
        case 12: // C,D
          seg(e3(), e1());
          break;
        case 6: // B,C
        case 9: // A,D
          seg(e0(), e2());
          break;
        case 5: {
          // A, C high; B, D low — saddle
          const mean = (vA + vB + vC + vD) * 0.25;
          if (mean > L) {
            seg(e0(), e1());
            seg(e2(), e3());
          } else {
            seg(e3(), e0());
            seg(e1(), e2());
          }
          break;
        }
        case 10: {
          // B, D high; A, C low — saddle
          const mean = (vA + vB + vC + vD) * 0.25;
          if (mean > L) {
            seg(e3(), e0());
            seg(e1(), e2());
          } else {
            seg(e0(), e1());
            seg(e2(), e3());
          }
          break;
        }
      }
    }
  }
}

export function renderFieldArrows(
  ctx: CanvasRenderingContext2D,
  V: Float32Array,
  fixed: Uint8Array,
  N: number,
  cellSize: number,
  step = 5,
): void {
  type Sample = { i: number; j: number; ex: number; ey: number; mag: number };
  const samples: Sample[] = [];
  let emax = 0;
  for (let i = step; i < N - step; i += step) {
    for (let j = step; j < N - step; j += step) {
      if ((fixed[idx(i, j, N)] as number) === 1) continue;
      const vR = V[idx(i + 1, j, N)] as number;
      const vL = V[idx(i - 1, j, N)] as number;
      const vD = V[idx(i, j + 1, N)] as number;
      const vU = V[idx(i, j - 1, N)] as number;
      const ex = -(vR - vL) * 0.5;
      const ey = -(vD - vU) * 0.5;
      const mag = Math.sqrt(ex * ex + ey * ey);
      if (mag > emax) emax = mag;
      samples.push({ i, j, ex, ey, mag });
    }
  }
  if (emax <= 0) return;
  const threshold = 0.02 * emax;
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.78)";
  ctx.fillStyle = "rgba(0,0,0,0.78)";
  ctx.lineWidth = 0.9;
  const headSize = 3.2;
  for (const s of samples) {
    if (s.mag < threshold) continue;
    const lenScale = (0.25 + 0.75 * Math.sqrt(s.mag / emax)) * cellSize * step * 0.78;
    const angle = Math.atan2(s.ey, s.ex);
    const cx = (s.i + 0.5) * cellSize;
    const cy = (s.j + 0.5) * cellSize;
    const dx = Math.cos(angle) * lenScale * 0.5;
    const dy = Math.sin(angle) * lenScale * 0.5;
    const x0 = cx - dx;
    const y0 = cy - dy;
    const x1 = cx + dx;
    const y1 = cy + dy;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    // Triangular head
    const hx = Math.cos(angle);
    const hy = Math.sin(angle);
    const px = -hy;
    const py = hx;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(
      x1 - hx * headSize + px * headSize * 0.55,
      y1 - hy * headSize + py * headSize * 0.55,
    );
    ctx.lineTo(
      x1 - hx * headSize - px * headSize * 0.55,
      y1 - hy * headSize - py * headSize * 0.55,
    );
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function renderStreamlines(
  ctx: CanvasRenderingContext2D,
  V: Float32Array,
  fixed: Uint8Array,
  N: number,
  cellSize: number,
  density = 10,
): void {
  const visited = new Uint8Array(N * N);
  const h = 0.5;
  const maxSteps = 4 * N;
  const arrowSpacingPx = 80;
  const headSize = 4;

  const trace = (x0: number, y0: number, dir: 1 | -1): number[] => {
    const pts: number[] = [x0 * cellSize, y0 * cellSize];
    let x = x0;
    let y = y0;
    let lastIc = Math.round(x0);
    let lastJc = Math.round(y0);
    for (let step = 0; step < maxSteps; step++) {
      const k1 = sampleEForStreamline(V, fixed, N, x, y);
      if (k1.mag === 0) break;
      const nx1 = k1.ex / k1.mag;
      const ny1 = k1.ey / k1.mag;
      const k2 = sampleEForStreamline(
        V,
        fixed,
        N,
        x + 0.5 * h * dir * nx1,
        y + 0.5 * h * dir * ny1,
      );
      if (k2.mag === 0) break;
      const nx2 = k2.ex / k2.mag;
      const ny2 = k2.ey / k2.mag;
      const nxn = x + h * dir * nx2;
      const nyn = y + h * dir * ny2;
      const ic = Math.round(nxn);
      const jc = Math.round(nyn);
      if (ic < 1 || jc < 1 || ic >= N - 1 || jc >= N - 1) break;
      if ((fixed[idx(ic, jc, N)] as number) === 1) break;
      if (ic !== lastIc || jc !== lastJc) {
        if ((visited[idx(ic, jc, N)] as number) === 1) break;
        visited[idx(ic, jc, N)] = 1;
        lastIc = ic;
        lastJc = jc;
      }
      pts.push(nxn * cellSize, nyn * cellSize);
      x = nxn;
      y = nyn;
    }
    return pts;
  };

  const drawArrowheadsAlong = (pts: number[]): void => {
    let acc = 0;
    let nextAt = arrowSpacingPx * 0.5;
    for (let i = 2; i < pts.length; i += 2) {
      const x0 = pts[i - 2] as number;
      const y0 = pts[i - 1] as number;
      const x1 = pts[i] as number;
      const y1 = pts[i + 1] as number;
      const dx = x1 - x0;
      const dy = y1 - y0;
      const seg = Math.hypot(dx, dy);
      if (seg === 0) continue;
      acc += seg;
      while (acc >= nextAt) {
        const angle = Math.atan2(dy, dx);
        const hx = Math.cos(angle);
        const hy = Math.sin(angle);
        const px = -hy;
        const py = hx;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(
          x1 - hx * headSize + px * headSize * 0.55,
          y1 - hy * headSize + py * headSize * 0.55,
        );
        ctx.lineTo(
          x1 - hx * headSize - px * headSize * 0.55,
          y1 - hy * headSize - py * headSize * 0.55,
        );
        ctx.closePath();
        ctx.fill();
        nextAt += arrowSpacingPx;
      }
    }
  };

  const stepG = (N - 2) / density;
  const lines: number[][] = [];
  for (let sj = 0; sj < density; sj++) {
    for (let si = 0; si < density; si++) {
      const sx = 1 + (si + 0.5) * stepG;
      const sy = 1 + (sj + 0.5) * stepG;
      const ic = Math.round(sx);
      const jc = Math.round(sy);
      if (ic < 1 || jc < 1 || ic >= N - 1 || jc >= N - 1) continue;
      if ((fixed[idx(ic, jc, N)] as number) === 1) continue;
      if ((visited[idx(ic, jc, N)] as number) === 1) continue;
      visited[idx(ic, jc, N)] = 1;
      const fwd = trace(sx, sy, +1);
      const bwd = trace(sx, sy, -1);
      const pts: number[] = [];
      for (let i = bwd.length - 2; i >= 0; i -= 2) {
        pts.push(bwd[i] as number, (bwd[i + 1] as number));
      }
      for (let i = 2; i < fwd.length; i += 2) {
        pts.push(fwd[i] as number, (fwd[i + 1] as number));
      }
      if (pts.length >= 6) lines.push(pts);
    }
  }

  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.78)";
  ctx.fillStyle = "rgba(0,0,0,0.78)";
  ctx.lineWidth = 1.0;
  for (const pts of lines) {
    ctx.beginPath();
    ctx.moveTo(pts[0] as number, pts[1] as number);
    for (let i = 2; i < pts.length; i += 2) {
      ctx.lineTo(pts[i] as number, pts[i + 1] as number);
    }
    ctx.stroke();
    drawArrowheadsAlong(pts);
  }
  ctx.restore();
}

export function renderConductors(
  ctx: CanvasRenderingContext2D,
  fixed: Uint8Array,
  Vfix: Float32Array,
  N: number,
  cellSize: number,
): void {
  ctx.save();
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const k = idx(i, j, N);
      if ((fixed[k] as number) !== 1) continue;
      const v = Vfix[k] as number;
      ctx.fillStyle = v > 0 ? "#791F1F" : v < 0 ? "#0C447C" : "#2C2C2A";
      ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
    }
  }
  ctx.restore();
}

export function renderTrace(
  ctx: CanvasRenderingContext2D,
  trace: TraceShape | null,
  draft: TraceShape | null,
  cellSize: number,
): void {
  ctx.save();
  if (trace && trace.points.length >= 1) {
    drawTracePath(ctx, trace.points, cellSize, false);
  }
  if (draft && draft.points.length >= 1) {
    drawTracePath(ctx, draft.points, cellSize, true);
  }
  ctx.restore();
}

function drawTracePath(
  ctx: CanvasRenderingContext2D,
  points: ReadonlyArray<readonly [number, number]>,
  cellSize: number,
  dashed: boolean,
): void {
  ctx.save();
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#FACC15";
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 3;
  if (dashed) ctx.setLineDash([5, 4]);
  if (points.length >= 2) {
    ctx.beginPath();
    const p0 = points[0] as readonly [number, number];
    ctx.moveTo(p0[0] * cellSize, p0[1] * cellSize);
    for (let i = 1; i < points.length; i++) {
      const p = points[i] as readonly [number, number];
      ctx.lineTo(p[0] * cellSize, p[1] * cellSize);
    }
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.setLineDash([]);
  ctx.fillStyle = "#FACC15";
  ctx.strokeStyle = "#1f1f1f";
  ctx.lineWidth = 1;
  if (points.length === 1) {
    const p = points[0] as readonly [number, number];
    const cx = (p[0] as number) * cellSize;
    const cy = (p[1] as number) * cellSize;
    // Crosshair so a single-point probe is easier to spot than a tiny dot.
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#1f1f1f";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - 9, cy);
    ctx.lineTo(cx + 9, cy);
    ctx.moveTo(cx, cy - 9);
    ctx.lineTo(cx, cy + 9);
    ctx.stroke();
  } else {
    for (const p of [points[0], points[points.length - 1]]) {
      if (!p) continue;
      ctx.beginPath();
      ctx.arc((p[0] as number) * cellSize, (p[1] as number) * cellSize, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function renderAll(
  ctx: CanvasRenderingContext2D,
  grid: GridState,
  display: DisplayFlags,
  displaySize: number,
  vmax: number,
): void {
  const { V, fixed, Vfix, N } = grid;
  const cellSize = displaySize / N;
  ctx.clearRect(0, 0, displaySize, displaySize);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, displaySize, displaySize);
  if (display.heatmap) renderHeatmap(ctx, V, N, vmax, displaySize);
  if (display.equipotentials)
    renderEquipotentials(ctx, V, N, vmax, cellSize);
  if (display.arrows) renderFieldArrows(ctx, V, fixed, N, cellSize);
  else if (display.streamlines)
    renderStreamlines(ctx, V, fixed, N, cellSize);
  renderConductors(ctx, fixed, Vfix, N, cellSize);
}
