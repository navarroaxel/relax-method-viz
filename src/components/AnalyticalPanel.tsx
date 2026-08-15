"use client";

import { useEffect, useRef, useState } from "react";
import { divergentColor } from "@/lib/colormap";
import { useLanguage } from "@/contexts/LanguageContext";

type TabId = "spheres" | "plates";

const CW = 480;
const CH = 220;
const ML = 48;
const MR = 20;
const MT = 30;
const MB = 40;
const PW = CW - ML - MR;
const PH = CH - MT - MB;

function sphericalCoeffs(
  Ri: number,
  Ro: number,
  V1: number,
  V2: number,
): { A: number; B: number } {
  // A(1/Ri − 1/Ro) = V1 − V2
  const A = (V1 - V2) / (1 / Ri - 1 / Ro);
  const B = V1 - A / Ri;
  return { A, B };
}

function sphericalV(r: number, A: number, B: number): number {
  return A / r + B;
}

function platesV(x: number, d: number, V1: number, V2: number): number {
  return V1 + (V2 - V1) * (x / d);
}

function isDark(r: number, g: number, b: number): boolean {
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-44 shrink-0 text-zinc-600 dark:text-zinc-400">
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(parseFloat(e.target.value))
        }
        className="flex-1"
      />
      <span className="w-16 text-right font-mono text-zinc-700 dark:text-zinc-300">
        {display}
      </span>
    </div>
  );
}

export function AnalyticalPanel() {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [tab, setTab] = useState<TabId>("spheres");
  const [ri, setRi] = useState(0.25);
  const [ro, setRo] = useState(0.75);
  const [v1Sph, setV1Sph] = useState(100);
  const [v2Sph, setV2Sph] = useState(0);
  const [d, setD] = useState(0.8);
  const [v1Plt, setV1Plt] = useState(100);
  const [v2Plt, setV2Plt] = useState(0);

  const { A, B } = sphericalCoeffs(ri, ro, v1Sph, v2Sph);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CW, CH);
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, CW, CH);

    const isSpherical = tab === "spheres";
    const v1 = isSpherical ? v1Sph : v1Plt;
    const v2 = isSpherical ? v2Sph : v2Plt;
    const vmax = Math.max(Math.abs(v1), Math.abs(v2)) || 1;

    const xMin = isSpherical ? ri : 0;
    const xMax = isSpherical ? ro : d;

    const rawYMin = Math.min(v1, v2);
    const rawYMax = Math.max(v1, v2);
    const ySpan = rawYMax - rawYMin;
    const yPad = ySpan > 0 ? ySpan * 0.15 : 20;
    const yMin = rawYMin - yPad;
    const yMax = rawYMax + yPad;
    const yRange = yMax - yMin;

    const toSX = (x: number) => ML + ((x - xMin) / (xMax - xMin)) * PW;
    const toSY = (v: number) => MT + PH - ((v - yMin) / yRange) * PH;

    // Axes
    ctx.strokeStyle = "#d4d4d8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ML, MT);
    ctx.lineTo(ML, MT + PH);
    ctx.lineTo(ML + PW, MT + PH);
    ctx.stroke();

    // V = 0 dashed line
    if (yMin < 0 && yMax > 0) {
      const y0 = toSY(0);
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "#a1a1aa";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ML, y0);
      ctx.lineTo(ML + PW, y0);
      ctx.stroke();
      ctx.restore();
    }

    ctx.font = "10px monospace";

    // X ticks
    for (let i = 0; i <= 4; i++) {
      const frac = i / 4;
      const xVal = xMin + frac * (xMax - xMin);
      const sx = toSX(xVal);
      ctx.strokeStyle = "#d4d4d8";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, MT + PH);
      ctx.lineTo(sx, MT + PH + 4);
      ctx.stroke();
      ctx.fillStyle = "#71717a";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(xVal.toFixed(2), sx, MT + PH + 6);
    }

    // Y ticks
    for (let i = 0; i <= 4; i++) {
      const frac = i / 4;
      const vVal = yMin + frac * yRange;
      const sy = toSY(vVal);
      ctx.strokeStyle = "#d4d4d8";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ML - 4, sy);
      ctx.lineTo(ML, sy);
      ctx.stroke();
      ctx.fillStyle = "#71717a";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(vVal.toFixed(0), ML - 6, sy);
    }

    // Axis labels
    ctx.fillStyle = "#52525b";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(isSpherical ? "r" : "x", ML + PW / 2, MT + PH + 24);
    ctx.save();
    ctx.translate(12, MT + PH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = "middle";
    ctx.fillText("V (V)", 0, 0);
    ctx.restore();

    // Canvas title
    ctx.fillStyle = "#3f3f46";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(
      isSpherical ? t("analytical.canvas_spheres") : t("analytical.canvas_plates"),
      ML + PW / 2,
      8,
    );

    // Curve — colored segments
    const { A: coeffA, B: coeffB } = sphericalCoeffs(ri, ro, v1Sph, v2Sph);
    const NPTS = 400;
    const pts: Array<{ cx: number; cy: number; v: number }> = [];
    for (let i = 0; i < NPTS; i++) {
      const frac = i / (NPTS - 1);
      let xVal: number;
      let vVal: number;
      if (isSpherical) {
        xVal = ri + frac * (ro - ri);
        vVal = sphericalV(xVal, coeffA, coeffB);
      } else {
        xVal = frac * d;
        vVal = platesV(xVal, d, v1Plt, v2Plt);
      }
      pts.push({ cx: toSX(xVal), cy: toSY(vVal), v: vVal });
    }

    ctx.lineWidth = 2;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      if (!p0 || !p1) continue;
      const vmid = (p0.v + p1.v) / 2;
      const [r, g, b] = divergentColor(vmid, vmax);
      ctx.strokeStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      ctx.moveTo(p0.cx, p0.cy);
      ctx.lineTo(p1.cx, p1.cy);
      ctx.stroke();
    }

    // Boundary condition circles
    const bcList = isSpherical
      ? [
          { xv: ri, vv: v1Sph },
          { xv: ro, vv: v2Sph },
        ]
      : [
          { xv: 0, vv: v1Plt },
          { xv: d, vv: v2Plt },
        ];

    for (const bc of bcList) {
      const [r, g, b] = divergentColor(bc.vv, vmax);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.strokeStyle = "#3f3f46";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(toSX(bc.xv), toSY(bc.vv), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }, [tab, ri, ro, v1Sph, v2Sph, d, v1Plt, v2Plt, t]);

  return (
    <div className="flex flex-col gap-3">
      {/* Tab bar */}
      <div className="flex overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => setTab("spheres")}
          className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
            tab === "spheres"
              ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
              : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          {t("analytical.tab_spheres")}
        </button>
        <button
          type="button"
          onClick={() => setTab("plates")}
          className={`flex-1 border-l border-zinc-200 px-3 py-1.5 text-xs font-medium transition-colors dark:border-zinc-700 ${
            tab === "plates"
              ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
              : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          {t("analytical.tab_plates")}
        </button>
      </div>

      {/* Sliders */}
      <div className="flex flex-col gap-2">
        {tab === "spheres" ? (
          <>
            <SliderRow
              label={t("analytical.ri")}
              value={ri}
              min={0.1}
              max={0.9}
              step={0.05}
              onChange={(v) => {
                setRi(v);
                if (ro <= v + 0.05) setRo(Math.min(1.0, v + 0.05));
              }}
              display={ri.toFixed(2)}
            />
            <SliderRow
              label={t("analytical.ro")}
              value={ro}
              min={0.2}
              max={1.0}
              step={0.05}
              onChange={(v) => {
                if (v > ri + 0.05) setRo(v);
              }}
              display={ro.toFixed(2)}
            />
            <SliderRow
              label={t("analytical.v1_sphere")}
              value={v1Sph}
              min={-100}
              max={100}
              step={1}
              onChange={setV1Sph}
              display={`${v1Sph.toFixed(0)} V`}
            />
            <SliderRow
              label={t("analytical.v2_sphere")}
              value={v2Sph}
              min={-100}
              max={100}
              step={1}
              onChange={setV2Sph}
              display={`${v2Sph.toFixed(0)} V`}
            />
          </>
        ) : (
          <>
            <SliderRow
              label={t("analytical.d")}
              value={d}
              min={0.1}
              max={1.0}
              step={0.05}
              onChange={setD}
              display={d.toFixed(2)}
            />
            <SliderRow
              label={t("analytical.v1_plate")}
              value={v1Plt}
              min={-100}
              max={100}
              step={1}
              onChange={setV1Plt}
              display={`${v1Plt.toFixed(0)} V`}
            />
            <SliderRow
              label={t("analytical.v2_plate")}
              value={v2Plt}
              min={-100}
              max={100}
              step={1}
              onChange={setV2Plt}
              display={`${v2Plt.toFixed(0)} V`}
            />
          </>
        )}
      </div>

      {/* Formula */}
      <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
        {tab === "spheres" ? (
          <>
            {t("analytical.formula")}: V(r) = A/r + B &nbsp;&nbsp; A ={" "}
            {A.toFixed(2)} &nbsp;&nbsp; B = {B.toFixed(2)}
          </>
        ) : (
          <>
            {t("analytical.formula")}: V(x) = V₁ + (V₂ − V₁)·x/d &nbsp;&nbsp;
            = {v1Plt.toFixed(0)} + ({((v2Plt - v1Plt) / d).toFixed(2)})·x
          </>
        )}
      </p>

      {/* SVG sphere diagram — spheres tab only */}
      {tab === "spheres" && (() => {
        const cx = 160;
        const cy = 110;
        const MAX_PX = 90;
        const riPx = (ri / ro) * MAX_PX;
        const roPx = MAX_PX;
        const svgVmax = Math.max(Math.abs(v1Sph), Math.abs(v2Sph), 1);
        const [r1, g1, b1] = divergentColor(v1Sph, svgVmax);
        const [r2, g2, b2] = divergentColor(v2Sph, svgVmax);
        const colorInner = `rgb(${r1},${g1},${b1})`;
        const colorOuter = `rgb(${r2},${g2},${b2})`;
        const labelColorInner = isDark(r1, g1, b1) ? "#ffffff" : "#1a1a1a";

        const outerPath =
          `M ${cx - roPx} ${cy} ` +
          `A ${roPx} ${roPx} 0 1 0 ${cx + roPx} ${cy} ` +
          `A ${roPx} ${roPx} 0 1 0 ${cx - roPx} ${cy} Z ` +
          `M ${cx - riPx} ${cy} ` +
          `A ${riPx} ${riPx} 0 1 1 ${cx + riPx} ${cy} ` +
          `A ${riPx} ${riPx} 0 1 1 ${cx - riPx} ${cy} Z`;

        return (
          <svg
            viewBox="0 0 320 220"
            width="100%"
            aria-label="Diagrama de corte transversal: esferas concéntricas"
            style={{ display: "block", maxWidth: 480 }}
            className="rounded border border-zinc-200 dark:border-zinc-700"
          >
            <defs>
              <pattern
                id="hatch-insulator"
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line
                  x1="0" y1="0" x2="0" y2="6"
                  stroke="currentColor"
                  strokeWidth="0.8"
                  strokeOpacity="0.25"
                />
              </pattern>
              <clipPath id="annulus-clip">
                <path d={outerPath} fillRule="evenodd" />
              </clipPath>
            </defs>

            {/* Outer conductor disc — background */}
            <circle cx={cx} cy={cy} r={roPx} fill={colorOuter} />

            {/* Insulator annular region — neutral fill + hatch */}
            <circle
              cx={cx} cy={cy} r={roPx}
              fill="#f0ede6"
              clipPath="url(#annulus-clip)"
            />
            <circle
              cx={cx} cy={cy} r={roPx}
              fill="url(#hatch-insulator)"
              clipPath="url(#annulus-clip)"
            />

            {/* Inner conductor */}
            <circle cx={cx} cy={cy} r={riPx} fill={colorInner} />

            {/* Conductor strokes */}
            <circle cx={cx} cy={cy} r={roPx} fill="none" stroke={colorOuter} strokeWidth="3" />
            <circle cx={cx} cy={cy} r={riPx} fill="none" stroke={colorInner} strokeWidth="2" />

            {/* V₁ label — center of inner circle */}
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize="12" fontWeight="600" fill={labelColorInner}>
              V₁ = {v1Sph} V
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fontSize="11" fill={labelColorInner} opacity={0.8}>
              (interior)
            </text>

            {/* V₂ label — above the outer circle */}
            <text x={cx} y={cy - roPx - 10} textAnchor="middle" fontSize="12" fontWeight="600" fill="currentColor">
              V₂ = {v2Sph} V (exterior)
            </text>

            {/* "Aislante" label in the annular gap at 3 o'clock */}
            {riPx + 10 < roPx && (
              <text
                x={cx + (riPx + roPx) / 2}
                y={cy + 4}
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                opacity={0.65}
              >
                aislante
              </text>
            )}

            {/* Rᵢ dimension line */}
            <line
              x1={cx} y1={cy} x2={cx + riPx} y2={cy}
              stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" opacity={0.6}
            />
            <text x={cx + riPx / 2} y={cy - 5} textAnchor="middle" fontSize="10" fill="currentColor" opacity={0.8}>
              Rᵢ
            </text>

            {/* R₀ dimension line — offset below Rᵢ to avoid overlap */}
            <line
              x1={cx} y1={cy + 14} x2={cx + roPx} y2={cy + 14}
              stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" opacity={0.6}
            />
            <text x={cx + roPx / 2} y={cy + 26} textAnchor="middle" fontSize="10" fill="currentColor" opacity={0.8}>
              R₀
            </text>
          </svg>
        );
      })()}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={CW}
        height={CH}
        className="max-w-full rounded border border-zinc-200 dark:border-zinc-700"
      />
    </div>
  );
}
