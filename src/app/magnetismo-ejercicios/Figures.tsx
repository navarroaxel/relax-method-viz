import type { ReactElement, ReactNode } from "react";

import type { Params } from "./exercises";

const INK = "stroke-zinc-700 dark:stroke-zinc-300";
const INK_FILL = "fill-zinc-700 dark:fill-zinc-300";
const WIRE = "stroke-blue-600 dark:stroke-blue-400";
const WIRE_FILL = "fill-blue-600 dark:fill-blue-400";
const FIELD = "stroke-amber-600 dark:stroke-amber-400";
const FIELD_FILL = "fill-amber-600 dark:fill-amber-400";
const SOFT = "stroke-zinc-400 dark:stroke-zinc-500";

const v = (p: Params, k: string) => p[k] ?? 0;

function Frame({
  label,
  h = 170,
  children,
}: {
  label: string;
  h?: number;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox={`0 0 320 ${h}`}
      role="img"
      aria-label={label}
      className="mx-auto w-full max-w-md rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
    >
      <defs>
        <marker
          id="fig-arrow-k"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5L0 10z" className={INK_FILL} />
        </marker>
        <marker
          id="fig-arrow-b"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5L0 10z" className={WIRE_FILL} />
        </marker>
        <marker
          id="fig-arrow-a"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5L0 10z" className={FIELD_FILL} />
        </marker>
      </defs>
      {children}
    </svg>
  );
}

type Tone = "k" | "b" | "a";
const TONE_STROKE: Record<Tone, string> = { k: INK, b: WIRE, a: FIELD };

function Arrow({
  x1,
  y1,
  x2,
  y2,
  tone = "k",
  w = 1.6,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  tone?: Tone;
  w?: number;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      strokeWidth={w}
      className={TONE_STROKE[tone]}
      markerEnd={`url(#fig-arrow-${tone})`}
    />
  );
}

/** Cota con flechas en ambos extremos. */
function Dim({
  x1,
  y1,
  x2,
  y2,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      strokeWidth={1}
      className={INK}
      markerStart="url(#fig-arrow-k)"
      markerEnd="url(#fig-arrow-k)"
    />
  );
}

function T({
  x,
  y,
  children,
  anchor = "middle",
  tone = "k",
}: {
  x: number;
  y: number;
  children: ReactNode;
  anchor?: "start" | "middle" | "end";
  tone?: Tone;
}) {
  const fill = tone === "b" ? WIRE_FILL : tone === "a" ? FIELD_FILL : INK_FILL;
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={11}
      fontStyle="italic"
      className={`${fill} stroke-none`}
    >
      {children}
    </text>
  );
}

/** Corriente saliendo de la hoja. */
function Out({ x, y, r = 7 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={r}
        strokeWidth={1.6}
        className={`${WIRE} fill-white dark:fill-zinc-900`}
      />
      <circle cx={x} cy={y} r={2} className={WIRE_FILL} />
    </g>
  );
}

/** Corriente entrando a la hoja. */
function In({
  x,
  y,
  r = 7,
  tone = "b",
}: {
  x: number;
  y: number;
  r?: number;
  tone?: "b" | "a";
}) {
  const d = r * 0.7;
  const s = tone === "b" ? WIRE : FIELD;
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={r}
        strokeWidth={1.6}
        className={`${s} fill-white dark:fill-zinc-900`}
      />
      <path
        d={`M${x - d} ${y - d}L${x + d} ${y + d}M${x - d} ${y + d}L${x + d} ${y - d}`}
        strokeWidth={1.4}
        className={s}
      />
    </g>
  );
}

function Helmholtz({ p }: { p: Params }) {
  const x1 = 105;
  const x2 = 215;
  return (
    <Frame label="Dos bobinas coaxiales separadas una distancia R, con el punto P en el medio">
      <line
        x1={50}
        y1={90}
        x2={270}
        y2={90}
        strokeDasharray="4 3"
        className={SOFT}
      />
      {[x1, x2].map((x) => (
        <g key={x}>
          <ellipse
            cx={x}
            cy={90}
            rx={10}
            ry={48}
            strokeWidth={2}
            fill="none"
            className={WIRE}
          />
          <ellipse
            cx={x + 6}
            cy={90}
            rx={10}
            ry={48}
            strokeWidth={2}
            fill="none"
            className={WIRE}
          />
        </g>
      ))}
      <circle cx={160} cy={90} r={3.5} className={INK_FILL} />
      <T x={160} y={82}>
        P
      </T>
      <Arrow x1={170} y1={90} x2={196} y2={90} tone="a" w={2} />
      <T x={183} y={106} tone="a">
        B
      </T>
      <Dim x1={x1} y1={150} x2={x2} y2={150} />
      <T x={160} y={164}>
        R = {v(p, "R")} cm
      </T>
      <Dim x1={x2 + 30} y1={90} x2={x2 + 30} y2={42} />
      <T x={x2 + 36} y={70} anchor="start">
        R
      </T>
      <T x={x1} y={30} tone="b">
        N = {v(p, "N")} espiras
      </T>
      <T x={x2} y={30} tone="b">
        N = {v(p, "N")} espiras
      </T>
      <T x={26} y={92}>
        eje
      </T>
    </Frame>
  );
}

function EspiraFuerza({ p }: { p: Params }) {
  const gapHalf = 14;
  return (
    <Frame label="Espira rectangular con una abertura en el lado superior, a una distancia d de un conductor recto">
      <Arrow x1={20} y1={142} x2={300} y2={142} tone="b" w={3} />
      <T x={296} y={160} anchor="end" tone="b">
        I = {v(p, "I")} A
      </T>
      <path
        d={`M${150 - gapHalf} 40 H50 V108 H230 V40 H${150 + gapHalf}`}
        fill="none"
        strokeWidth={2}
        className={INK}
      />
      <Arrow x1={105} y1={40} x2={75} y2={40} />
      <Arrow x1={50} y1={60} x2={50} y2={90} />
      <Arrow x1={130} y1={108} x2={170} y2={108} />
      <Arrow x1={230} y1={90} x2={230} y2={60} />
      <Dim x1={50} y1={22} x2={230} y2={22} />
      <T x={140} y={16}>
        L = {v(p, "L")} cm
      </T>
      <Dim x1={252} y1={40} x2={252} y2={108} />
      <T x={258} y={78} anchor="start">
        h = {v(p, "h")} cm
      </T>
      <Dim x1={26} y1={108} x2={26} y2={142} />
      <T x={32} y={129} anchor="start">
        d = {v(p, "d")} cm
      </T>
      <Dim x1={150 - gapHalf} y1={52} x2={150 + gapHalf} y2={52} />
      <T x={150} y={68}>
        a = {v(p, "a")} cm
      </T>
      <T x={150} y={92} tone="a">
        espira
      </T>
    </Frame>
  );
}

function FemHilo({ p }: { p: Params }) {
  const crosses: [number, number][] = [
    [150, 82],
    [200, 82],
    [150, 112],
    [200, 112],
  ];
  return (
    <Frame label="Conductor recto vertical y espira rectangular coplanar a una distancia d">
      <Arrow x1={50} y1={150} x2={50} y2={22} tone="b" w={3} />
      <T x={58} y={18} anchor="start" tone="b">
        i(t) = {v(p, "I0")} sen({v(p, "w")}t) A
      </T>
      <rect
        x={100}
        y={65}
        width={130}
        height={80}
        fill="none"
        strokeWidth={2}
        className={INK}
      />
      {crosses.map(([x, y]) => (
        <In key={`${x}-${y}`} x={x} y={y} r={5} tone="a" />
      ))}
      <T x={175} y={103} tone="a">
        B (entrante)
      </T>
      <Dim x1={50} y1={148} x2={100} y2={148} />
      <T x={75} y={162}>
        d = {v(p, "d")} m
      </T>
      <Dim x1={100} y1={52} x2={230} y2={52} />
      <T x={165} y={46}>
        w = {v(p, "wd")} m
      </T>
      <Dim x1={252} y1={65} x2={252} y2={145} />
      <T x={258} y={109} anchor="start">
        h = {v(p, "h")} m
      </T>
    </Frame>
  );
}

function OndaPlana({ p }: { p: Params }) {
  const ox = 90;
  const oy = 100;
  const pts: string[] = [];
  for (let k = 0; k <= 100; k++) {
    const z = (k / 100) * 190;
    pts.push(`${ox + z},${oy - 38 * Math.sin((z / 190) * 2 * Math.PI * 1.5)}`);
  }
  return (
    <Frame label="Onda plana que se propaga en +z con E sobre y y H sobre menos x">
      <polyline
        points={pts.join(" ")}
        fill="none"
        strokeWidth={1.4}
        strokeDasharray="3 2"
        className={SOFT}
      />
      <Arrow x1={ox} y1={oy} x2={290} y2={oy} />
      <T x={292} y={oy + 28} anchor="end">
        z (propagación)
      </T>
      <Arrow x1={ox} y1={oy} x2={ox} y2={26} />
      <T x={ox - 6} y={32} anchor="end">
        y
      </T>
      <Arrow x1={ox} y1={oy} x2={ox - 42} y2={oy + 42} />
      <T x={ox - 46} y={oy + 52} anchor="end">
        x
      </T>
      <Arrow x1={170} y1={oy} x2={170} y2={oy - 50} tone="b" w={2.2} />
      <T x={165} y={oy - 42} anchor="end" tone="b">
        E
      </T>
      <Arrow x1={170} y1={oy} x2={204} y2={oy - 34} tone="a" w={2.2} />
      <T x={210} y={oy - 36} anchor="start" tone="a">
        H (−x)
      </T>
      <T x={190} y={162}>
        E_M = {v(p, "EM")} V/m · f = {v(p, "f")} MHz
      </T>
    </Frame>
  );
}

function TresConductores({ p }: { p: Params }) {
  const s = 110;
  const h = (s * Math.sqrt(3)) / 2;
  const top: [number, number] = [160, 28];
  const bl: [number, number] = [160 - s / 2, 28 + h];
  const br: [number, number] = [160 + s / 2, 28 + h];
  const cx = 160;
  const cy = 28 + (2 * h) / 3;
  const vertices = [top, bl, br];
  return (
    <Frame label="Tres conductores paralelos en los vértices de un triángulo equilátero, con corriente saliendo de la hoja">
      <polygon
        points={vertices.map((q) => q.join(",")).join(" ")}
        fill="none"
        strokeDasharray="4 3"
        className={SOFT}
      />
      {vertices.map(([x, y]) => {
        const dx = cx - x;
        const dy = cy - y;
        const len = Math.hypot(dx, dy);
        const ux = dx / len;
        const uy = dy / len;
        return (
          <g key={`${x}-${y}`}>
            <Arrow
              x1={x + ux * 12}
              y1={y + uy * 12}
              x2={x + ux * 42}
              y2={y + uy * 42}
              tone="a"
              w={2}
            />
            <Out x={x} y={y} r={8} />
          </g>
        );
      })}
      <Dim x1={bl[0]} y1={bl[1] + 20} x2={br[0]} y2={br[1] + 20} />
      <T x={160} y={bl[1] + 34}>
        d = {v(p, "d")} cm
      </T>
      <T x={top[0] + 14} y={top[1] + 4} anchor="start" tone="b">
        I = {v(p, "I")} A
      </T>
      <T x={cx} y={cy + 4} tone="a">
        F
      </T>
    </Frame>
  );
}

function TuboHueco({ p }: { p: Params }) {
  const b = 62;
  const a = Math.max(8, (b * v(p, "a")) / Math.max(v(p, "b"), 1));
  const cx = 110;
  const cy = 90;
  return (
    <Frame label="Sección de un conductor tubular de radio interno a y externo b">
      <circle
        cx={cx}
        cy={cy}
        r={b}
        className={`${WIRE} fill-blue-100 dark:fill-blue-950`}
        strokeWidth={2}
      />
      <circle
        cx={cx}
        cy={cy}
        r={a}
        className={`${INK} fill-white dark:fill-zinc-900`}
        strokeWidth={1.6}
      />
      <Out x={cx + (a + b) / 2} y={cy} r={5} />
      <Out x={cx - (a + b) / 2} y={cy} r={5} />
      <Out x={cx} y={cy - (a + b) / 2} r={5} />
      <Out x={cx} y={cy + (a + b) / 2} r={5} />
      <line
        x1={cx}
        y1={cy}
        x2={cx + a * 0.8}
        y2={cy + a * 0.6}
        className={INK}
      />
      <T x={cx + a * 0.4 - 4} y={cy + a * 0.3 + 12} anchor="end">
        a
      </T>
      <line
        x1={cx}
        y1={cy}
        x2={cx + b * 0.6}
        y2={cy - b * 0.8}
        className={INK}
      />
      <T x={cx + b * 0.6 + 4} y={cy - b * 0.8 - 2} anchor="start">
        b
      </T>
      <T x={cx - 4} y={cy - 4} anchor="end" tone="a">
        H = 0
      </T>
      <T x={215} y={70} anchor="start">
        a = {v(p, "a")} mm
      </T>
      <T x={215} y={86} anchor="start">
        b = {v(p, "b")} mm
      </T>
      <T x={215} y={110} anchor="start" tone="b">
        I saliendo de la hoja
      </T>
    </Frame>
  );
}

function Coaxial({ p }: { p: Params }) {
  const b = 62;
  const a = Math.max(9, (b * v(p, "a")) / Math.max(v(p, "b"), 1));
  const cx = 110;
  const cy = 90;
  return (
    <Frame label="Sección de una línea coaxial: conductor interno macizo de radio a y externo delgado de radio b">
      <circle
        cx={cx}
        cy={cy}
        r={b}
        fill="none"
        strokeWidth={3}
        className={WIRE}
      />
      <circle
        cx={cx}
        cy={cy}
        r={a}
        className={`${WIRE} fill-blue-100 dark:fill-blue-950`}
        strokeWidth={1.6}
      />
      {[0, 90, 180, 270].map((deg) => (
        <In
          key={deg}
          x={cx + b * Math.cos((deg * Math.PI) / 180)}
          y={cy + b * Math.sin((deg * Math.PI) / 180)}
          r={5}
        />
      ))}
      <line x1={cx} y1={cy} x2={cx + a} y2={cy} className={INK} />
      <T x={cx + a / 2} y={cy + 13}>
        a
      </T>
      <line
        x1={cx}
        y1={cy}
        x2={cx - b * 0.6}
        y2={cy - b * 0.8}
        className={INK}
      />
      <T x={cx - b * 0.6 - 4} y={cy - b * 0.8 - 2} anchor="end">
        b
      </T>
      <T x={215} y={60} anchor="start">
        a = {v(p, "a")} mm
      </T>
      <T x={215} y={76} anchor="start">
        b = {v(p, "b")} mm
      </T>
      <T x={215} y={100} anchor="start" tone="b">
        ida: conductor interno
      </T>
      <T x={215} y={116} anchor="start" tone="b">
        vuelta: conductor externo
      </T>
      <T x={215} y={140} anchor="start" tone="a">
        H = 0 para r &gt; b
      </T>
    </Frame>
  );
}

function Toroide({ p }: { p: Params }) {
  const cx = 90;
  const cy = 90;
  const bpx = 68;
  const apx = (bpx * v(p, "a")) / Math.max(v(p, "b"), 1);
  const ticks = Array.from({ length: 28 }, (_, k) => (k / 28) * 2 * Math.PI);
  const hpx = Math.min(70, (bpx * v(p, "h")) / Math.max(v(p, "b"), 1) + 16);
  const wpx = (bpx - apx) / 2 + 18;
  return (
    <Frame label="Toroide de sección rectangular de alto h y radios a y b, visto desde arriba y en corte">
      <circle
        cx={cx}
        cy={cy}
        r={bpx}
        fill="none"
        strokeWidth={1.6}
        className={INK}
      />
      <circle
        cx={cx}
        cy={cy}
        r={apx}
        fill="none"
        strokeWidth={1.6}
        className={INK}
      />
      {ticks.map((t) => (
        <line
          key={t}
          x1={cx + (apx - 5) * Math.cos(t)}
          y1={cy + (apx - 5) * Math.sin(t)}
          x2={cx + (bpx + 5) * Math.cos(t)}
          y2={cy + (bpx + 5) * Math.sin(t)}
          strokeWidth={1.2}
          className={WIRE}
        />
      ))}
      <line
        x1={cx}
        y1={cy}
        x2={cx + apx * 0.8}
        y2={cy + apx * 0.6}
        className={INK}
      />
      <T x={cx + apx * 0.4 - 3} y={cy + apx * 0.3 + 12} anchor="end">
        a
      </T>
      <line
        x1={cx}
        y1={cy}
        x2={cx + bpx * 0.6}
        y2={cy - bpx * 0.8}
        className={INK}
      />
      <T x={cx + bpx * 0.6 + 8} y={cy - bpx * 0.8 + 4} anchor="start">
        b
      </T>

      <rect
        x={196}
        y={90 - hpx / 2}
        width={wpx}
        height={hpx}
        className={`${INK} fill-blue-100 dark:fill-blue-950`}
        strokeWidth={1.6}
      />
      <Dim x1={188} y1={90 - hpx / 2} x2={188} y2={90 + hpx / 2} />
      <T x={183} y={94} anchor="end">
        h
      </T>
      <T x={196 + wpx / 2} y={90 + hpx / 2 + 16}>
        corte
      </T>
      <T x={250} y={60} anchor="start">
        N = {v(p, "N")}
      </T>
      <T x={250} y={76} anchor="start">
        h = {v(p, "h")} cm
      </T>
      <T x={250} y={92} anchor="start">
        a = {v(p, "a")} cm
      </T>
      <T x={250} y={108} anchor="start">
        b = {v(p, "b")} cm
      </T>
    </Frame>
  );
}
function Solenoide({ p }: { p: Params }) {
  const xs = Array.from({ length: 13 }, (_, k) => 62 + k * 16);
  return (
    <Frame label="Solenoide largo de radio r con n vueltas por metro; el campo B es axial">
      <rect
        x={50}
        y={55}
        width={220}
        height={70}
        fill="none"
        strokeWidth={1}
        strokeDasharray="4 3"
        className={SOFT}
      />
      {xs.map((x) => (
        <line
          key={x}
          x1={x}
          y1={55}
          x2={x + 8}
          y2={125}
          strokeWidth={1.8}
          className={WIRE}
        />
      ))}
      <path
        d="M44 50 l6 10 l-6 10 M276 50 l-6 10 l6 10"
        fill="none"
        className={SOFT}
      />
      <Arrow x1={30} y1={90} x2={290} y2={90} tone="a" w={2} />
      <T x={290} y={82} anchor="end" tone="a">
        B
      </T>
      <Dim x1={160} y1={90} x2={160} y2={55} />
      <T x={154} y={76} anchor="end">
        r = {v(p, "r")} mm
      </T>
      <T x={160} y={148} tone="b">
        n = {v(p, "n")} vueltas/m (solenoide muy largo)
      </T>
    </Frame>
  );
}

const FIGURES: Record<string, (p: Params) => ReactElement> = {
  "p-helmholtz": (p) => <Helmholtz p={p} />,
  "p-espira-fuerza": (p) => <EspiraFuerza p={p} />,
  "p-fem-hilo": (p) => <FemHilo p={p} />,
  "p-onda-plana": (p) => <OndaPlana p={p} />,
  "p-tres-conductores": (p) => <TresConductores p={p} />,
  "p-inductancia-tubo": (p) => <TuboHueco p={p} />,
  g32: (p) => <Toroide p={p} />,
  g33: (p) => <Solenoide p={p} />,
  g36: (p) => <Coaxial p={p} />,
};

export const FIGURE_IDS = Object.keys(FIGURES);

export function ExerciseFigure({ id, params }: { id: string; params: Params }) {
  const render = FIGURES[id];
  return render ? render(params) : null;
}
