export const WHITE: readonly [number, number, number] = [255, 255, 255];
export const RED: readonly [number, number, number] = [224, 75, 74];
export const BLUE: readonly [number, number, number] = [55, 138, 221];

export function divergentColor(
  v: number,
  vmax: number,
): [number, number, number] {
  if (vmax <= 0 || !Number.isFinite(vmax))
    return [WHITE[0], WHITE[1], WHITE[2]];
  const t = Math.max(-1, Math.min(1, v / vmax));
  const target = t >= 0 ? RED : BLUE;
  const a = Math.abs(t);
  return [
    Math.round(WHITE[0] + (target[0] - WHITE[0]) * a),
    Math.round(WHITE[1] + (target[1] - WHITE[1]) * a),
    Math.round(WHITE[2] + (target[2] - WHITE[2]) * a),
  ];
}
