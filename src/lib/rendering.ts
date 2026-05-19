import { divergentColor } from "@/lib/colormap";
import { idx } from "@/lib/grid";
import type { DisplayFlags, GridState } from "@/types";

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

export function computeVmax(V: Float32Array): number {
  let max = 0;
  for (let k = 0; k < V.length; k++) {
    const v = V[k] as number;
    const a = v < 0 ? -v : v;
    if (a > max) max = a;
  }
  return max > 0 ? max : 1;
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

export function renderAll(
  ctx: CanvasRenderingContext2D,
  grid: GridState,
  display: DisplayFlags,
  displaySize: number,
): void {
  const { V, fixed, Vfix, N } = grid;
  const cellSize = displaySize / N;
  ctx.clearRect(0, 0, displaySize, displaySize);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, displaySize, displaySize);
  const vmax = computeVmax(V);
  if (display.heatmap) renderHeatmap(ctx, V, N, vmax, displaySize);
  if (display.equipotentials)
    renderEquipotentials(ctx, V, N, vmax, cellSize);
  if (display.arrows) renderFieldArrows(ctx, V, fixed, N, cellSize);
  renderConductors(ctx, fixed, Vfix, N, cellSize);
}
