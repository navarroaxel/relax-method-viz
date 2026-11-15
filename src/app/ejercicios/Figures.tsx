import type { ReactElement, ReactNode } from "react";

import {
  alphaGoodConductor,
  attenuationDistance,
  C0,
  cableMultiLayer,
  cableMultiLayerField,
  cableSingleLayer,
  conductivityFromDepth,
  displacementCurrentAmplitude,
  loopTorque,
  MU0,
  solenoidField,
  shellField,
  solidWireField,
  sphericalShellPotential,
  thinTubeField,
  toroidField,
  uniformSphereField,
} from "@/lib/teoriaExercises";

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
          markerUnits="userSpaceOnUse"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5L0 10z" className={INK_FILL} />
        </marker>
        <marker
          id="fig-arrow-b"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerUnits="userSpaceOnUse"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5L0 10z" className={WIRE_FILL} />
        </marker>
        <marker
          id="fig-arrow-a"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerUnits="userSpaceOnUse"
          markerWidth="8"
          markerHeight="8"
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
  const ax = 150;
  const y1 = 38;
  const y2 = 122;
  return (
    <Frame label="Dos bobinas coaxiales con eje vertical z, separadas una distancia R, con el punto P en el medio">
      <line
        x1={ax}
        y1={8}
        x2={ax}
        y2={162}
        strokeDasharray="4 3"
        className={SOFT}
      />
      {[y1, y2].map((y) => (
        <g key={y}>
          <ellipse
            cx={ax}
            cy={y}
            rx={48}
            ry={10}
            strokeWidth={2}
            fill="none"
            className={WIRE}
          />
          <ellipse
            cx={ax}
            cy={y + 6}
            rx={48}
            ry={10}
            strokeWidth={2}
            fill="none"
            className={WIRE}
          />
        </g>
      ))}
      <circle cx={ax} cy={80} r={3.5} className={INK_FILL} />
      <T x={ax + 8} y={96} anchor="start">
        P
      </T>
      <Arrow x1={ax} y1={72} x2={ax} y2={58} tone="a" w={2} />
      <T x={ax + 8} y={62} anchor="start" tone="a">
        B
      </T>
      <Dim x1={70} y1={y1} x2={70} y2={y2} />
      <T x={64} y={84} anchor="end">
        R = {v(p, "R")} cm
      </T>
      <Dim x1={ax} y1={20} x2={ax + 48} y2={20} />
      <T x={ax + 24} y={14}>
        R
      </T>
      <T x={212} y={y1 + 4} anchor="start" tone="b">
        N = {v(p, "N")} espiras
      </T>
      <T x={212} y={y2 + 10} anchor="start" tone="b">
        N = {v(p, "N")} espiras
      </T>
      <T x={ax - 6} y={160} anchor="end">
        eje z
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
        <Sub a="E" b="M" /> = {v(p, "EM")} V/m · f = {v(p, "f")} MHz
      </T>
    </Frame>
  );
}

const TRI = (() => {
  const s = 110;
  const h = (s * Math.sqrt(3)) / 2;
  const top: [number, number] = [160, 28];
  const bl: [number, number] = [160 - s / 2, 28 + h];
  const br: [number, number] = [160 + s / 2, 28 + h];
  return {
    top,
    bl,
    br,
    cx: 160,
    cy: 28 + (2 * h) / 3,
    vertices: [top, bl, br],
  };
})();

const unitVec = (x1: number, y1: number, x2: number, y2: number) => {
  const len = Math.hypot(x2 - x1, y2 - y1);
  return [(x2 - x1) / len, (y2 - y1) / len] as const;
};

function TresConductores({
  p,
  forces = false,
}: {
  p: Params;
  forces?: boolean;
}) {
  const { top, bl, br, cx, cy, vertices } = TRI;
  return (
    <Frame label="Tres conductores paralelos en los vértices de un triángulo equilátero, con corriente saliendo de la hoja">
      <polygon
        points={vertices.map((q) => q.join(",")).join(" ")}
        fill="none"
        strokeDasharray="4 3"
        className={SOFT}
      />
      {vertices.map(([x, y]) => {
        const [ux, uy] = unitVec(x, y, cx, cy);
        const others = vertices.filter(([ox, oy]) => ox !== x || oy !== y);
        return (
          <g key={`${x}-${y}`}>
            {forces &&
              others.map(([ox, oy]) => {
                const [vx, vy] = unitVec(x, y, ox, oy);
                return (
                  <Arrow
                    key={`${ox}-${oy}`}
                    x1={x + vx * 12}
                    y1={y + vy * 12}
                    x2={x + vx * 34}
                    y2={y + vy * 34}
                    w={1.4}
                  />
                );
              })}
            {forces && (
              <Arrow
                x1={x + ux * 12}
                y1={y + uy * 12}
                x2={x + ux * 50}
                y2={y + uy * 50}
                tone="a"
                w={2.2}
              />
            )}
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
      {forces && (
        <>
          <T x={232} y={50} anchor="start">
            F₁₂ (cada par)
          </T>
          <T x={232} y={66} anchor="start" tone="a">
            F (resultante)
          </T>
          <T x={232} y={92} anchor="start">
            ΣF = 0
          </T>
        </>
      )}
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

/** Vista desde +z: las fuerzas en los lados salen o entran de la hoja y el par queda en el plano. */
function EspiraPar({ p }: { p: Params }) {
  const bx = v(p, "bx");
  const by = v(p, "by");
  const cx = 110;
  const cy = 85;
  const hw = 55;
  const hh = Math.max(
    24,
    Math.min(50, (hw * v(p, "b2")) / Math.max(v(p, "b1"), 1)),
  );
  const t = loopTorque(v(p, "I"), v(p, "b1") / 100, v(p, "b2") / 100, bx, by);
  const unit = (x: number, y: number, len: number) => {
    const m = Math.hypot(x, y) || 1;
    return [(x / m) * len, (-y / m) * len] as const;
  };
  const [bdx, bdy] = unit(bx, by, 44);
  const [tdx, tdy] = unit(t.tx, t.ty, 44);
  const force = (x: number, y: number, outOfPage: boolean, name: string) => (
    <g>
      {outOfPage ? <Out x={x} y={y} r={7} /> : <In x={x} y={y} r={7} />}
      <T
        x={x + (x > cx ? 12 : x < cx ? -12 : 0)}
        y={y + (y > cy ? 20 : y < cy ? -12 : 4)}
        anchor={x > cx ? "start" : x < cx ? "end" : "middle"}
      >
        {name}
      </T>
    </g>
  );
  return (
    <Frame label="Espira vista desde +z con las fuerzas de cada lado, el campo B en el plano y el par resultante">
      <rect
        x={cx - hw}
        y={cy - hh}
        width={2 * hw}
        height={2 * hh}
        fill="none"
        strokeWidth={2}
        className={INK}
      />
      <Arrow x1={cx - 8} y1={cy + hh} x2={cx + 12} y2={cy + hh} />
      <Arrow x1={cx + hw} y1={cy + 8} x2={cx + hw} y2={cy - 12} />
      <Arrow x1={cx + 8} y1={cy - hh} x2={cx - 12} y2={cy - hh} />
      <Arrow x1={cx - hw} y1={cy - 8} x2={cx - hw} y2={cy + 12} />
      {force(cx - 22, cy + hh, by > 0, "F₁z")}
      {force(cx + hw, cy + 22, bx <= 0, "F₂z")}
      {force(cx + 22, cy - hh, by <= 0, "F₃z")}
      {force(cx - hw, cy - 22, bx > 0, "F₄z")}
      <Out x={cx} y={cy} r={6} />
      <T x={cx + 10} y={cy + 4} anchor="start">
        m
      </T>
      <Arrow x1={cx} y1={cy} x2={cx + bdx} y2={cy + bdy} tone="a" w={2.2} />
      <T x={cx + bdx * 0.5 + 8} y={cy + bdy * 0.5 + 12} anchor="start" tone="a">
        B (plano)
      </T>
      <Arrow x1={cx} y1={cy} x2={cx + tdx} y2={cy + tdy} tone="b" w={2.2} />
      <T x={cx + tdx + 4} y={cy + tdy - 4} anchor="start" tone="b">
        τ
      </T>
      <T x={215} y={34} anchor="start">
        ΣF = 0
      </T>
      <T x={215} y={50} anchor="start">
        (F₁z…F₄z: componentes z)
      </T>
      <T x={215} y={70} anchor="start" tone="b">
        τx = {Number((t.tx * 1e3).toPrecision(3))} mN·m
      </T>
      <T x={215} y={86} anchor="start" tone="b">
        τy = {Number((t.ty * 1e3).toPrecision(3))} mN·m
      </T>
      <T x={215} y={116} anchor="start">
        vista desde +z
      </T>
    </Frame>
  );
}

/** E radial, H azimutal y P = E × H axial: P es ortogonal a ambos. */
function PoyntingCoax({ p }: { p: Params }) {
  const b = 50;
  const a = Math.max(8, (b * v(p, "a")) / Math.max(v(p, "b"), 1));
  const cx = 62;
  const cy = 78;
  const mid = (a + b) / 2;
  const angles = [45, 135, 225, 315];
  const hAngles = [0, 90, 180, 270].map((d) => (d * Math.PI) / 180);
  // Vista longitudinal: z a la derecha, y arriba, x entrando a la hoja.
  const x0 = 150;
  const x1 = 305;
  return (
    <Frame
      label="Coaxial en continua: E radial, H azimutal y el vector de Poynting P a lo largo del cable, ortogonal a ambos"
      h={190}
    >
      <circle
        cx={cx}
        cy={cy}
        r={b}
        fill="none"
        strokeWidth={2.5}
        className={WIRE}
      />
      <circle
        cx={cx}
        cy={cy}
        r={a}
        className={`${WIRE} fill-blue-100 dark:fill-blue-950`}
        strokeWidth={1.6}
      />
      {angles.map((t) => (
        <g key={t}>
          <Arrow
            x1={cx + (a + 3) * Math.cos(t)}
            y1={cy - (a + 3) * Math.sin(t)}
            x2={cx + (b - 3) * Math.cos(t)}
            y2={cy - (b - 3) * Math.sin(t)}
            tone="b"
          />
        </g>
      ))}
      {hAngles.map((t) => (
        <g key={t}>
          <Arrow
            x1={cx + mid * Math.cos(t - 0.4)}
            y1={cy - mid * Math.sin(t - 0.4)}
            x2={cx + mid * Math.cos(t + 0.4)}
            y2={cy - mid * Math.sin(t + 0.4)}
            tone="a"
          />
        </g>
      ))}
      <Out x={cx} y={cy} r={Math.min(a - 2, 7)} />
      <T x={cx} y={cy + b + 18}>
        corte transversal
      </T>

      <line
        x1={x0}
        y1={cy - 50}
        x2={x1}
        y2={cy - 50}
        strokeWidth={2.5}
        className={WIRE}
      />
      <line
        x1={x0}
        y1={cy + 50}
        x2={x1}
        y2={cy + 50}
        strokeWidth={2.5}
        className={WIRE}
      />
      <rect
        x={x0}
        y={cy - 12}
        width={x1 - x0}
        height={24}
        className={`${WIRE} fill-blue-100 dark:fill-blue-950`}
        strokeWidth={1.6}
      />
      {[185, 250].map((x) => (
        <g key={x}>
          <Arrow x1={x} y1={cy - 14} x2={x} y2={cy - 46} tone="b" />
          <Out x={x + 14} y={cy - 30} r={5} />
          <Arrow x1={x + 24} y1={cy - 30} x2={x + 52} y2={cy - 30} w={2.6} />
          <Arrow x1={x} y1={cy + 14} x2={x} y2={cy + 46} tone="b" />
          <In x={x + 14} y={cy + 30} r={5} tone="a" />
          <Arrow x1={x + 24} y1={cy + 30} x2={x + 52} y2={cy + 30} w={2.6} />
        </g>
      ))}
      <T x={(x0 + x1) / 2} y={cy + b + 18}>
        corte longitudinal (I hacia +z)
      </T>
      <T x={14} y={178} anchor="start" tone="b">
        E: radial
      </T>
      <T x={100} y={178} anchor="start" tone="a">
        H: azimutal
      </T>
      <T x={196} y={178} anchor="start">
        P = E × H: axial
      </T>
    </Frame>
  );
}
const fmt = (x: number) => String(Number(x.toPrecision(3)));

interface PlotDot {
  x: number;
  y: number;
  label: string;
  anchor?: "start" | "middle" | "end";
  dy?: number;
}

interface PlotProps {
  ox: number;
  oy: number;
  w: number;
  h: number;
  xmax: number;
  ymax: number;
  fn: (x: number) => number;
  xlabel: string;
  ylabel: string;
  title?: string;
  vlines?: { x: number; label: string }[];
  dots?: PlotDot[];
}

/** Gráfico simple de una curva y(x) con ejes, marcas verticales y puntos rotulados. */
function Plot({
  ox,
  oy,
  w,
  h,
  xmax,
  ymax,
  fn,
  xlabel,
  ylabel,
  title,
  vlines = [],
  dots = [],
}: PlotProps) {
  const X = (x: number) => ox + (x / xmax) * w;
  const Y = (y: number) => oy + h - (Math.min(y, ymax) / ymax) * h;
  const pts = Array.from({ length: 121 }, (_, k) => {
    const x = (k / 120) * xmax;
    return `${X(x)},${Y(fn(x))}`;
  });
  return (
    <g>
      {title && (
        <T x={ox + w} y={oy - 18} anchor="end">
          {title}
        </T>
      )}
      <line
        x1={ox}
        y1={oy + h}
        x2={ox + w}
        y2={oy + h}
        strokeWidth={1.2}
        className={INK}
      />
      <line
        x1={ox}
        y1={oy}
        x2={ox}
        y2={oy + h}
        strokeWidth={1.2}
        className={INK}
      />
      {vlines.map((l) => (
        <g key={l.label}>
          <line
            x1={X(l.x)}
            y1={oy}
            x2={X(l.x)}
            y2={oy + h}
            strokeDasharray="3 3"
            className={SOFT}
          />
          <T x={X(l.x)} y={oy + h + 12}>
            {l.label}
          </T>
        </g>
      ))}
      <polyline
        points={pts.join(" ")}
        fill="none"
        strokeWidth={2}
        className={WIRE}
      />
      {dots.map((d) => (
        <g key={d.label}>
          <circle cx={X(d.x)} cy={Y(d.y)} r={3.5} className={FIELD_FILL} />
          <T
            x={X(d.x) + (d.anchor === "end" ? -6 : 6)}
            y={Y(d.y) + (d.dy ?? -6)}
            anchor={d.anchor ?? "start"}
            tone="a"
          >
            {d.label}
          </T>
        </g>
      ))}
      <T x={ox - 4} y={oy + 4} anchor="end">
        {fmt(ymax)}
      </T>
      <T x={ox - 4} y={oy + h} anchor="end">
        0
      </T>
      <T x={ox + w} y={oy + h + 24} anchor="end">
        {fmt(xmax)} {xlabel}
      </T>
      <T x={ox + 3} y={oy - 4} anchor="start">
        {ylabel}
      </T>
    </g>
  );
}

/** B(r) de un conductor macizo: lineal adentro, 1/r afuera. */
function CampoConductor({ p }: { p: Params }) {
  const bMm = v(p, "b");
  const rinMm = v(p, "rin");
  const routMm = v(p, "rout");
  const cur = v(p, "I");
  const B = (rMm: number) => solidWireField(cur, bMm / 1000, rMm / 1000) * 1e6;
  const xmax = Math.max(routMm * 1.15, bMm * 3);
  const ymax = B(bMm) * 1.15;
  return (
    <Frame
      label="Campo B en función de la distancia al eje de un conductor macizo: crece linealmente hasta r = b y decae como 1/r"
      h={185}
    >
      <Plot
        ox={46}
        oy={24}
        w={250}
        h={108}
        xmax={xmax}
        ymax={ymax}
        fn={B}
        xlabel="mm"
        ylabel="B (µT)"
        vlines={[{ x: bMm, label: "r = b" }]}
        dots={[
          {
            x: rinMm,
            y: B(rinMm),
            label: `${fmt(B(rinMm))} µT`,
            anchor: "end",
            dy: -8,
          },
          { x: routMm, y: B(routMm), label: `${fmt(B(routMm))} µT`, dy: -8 },
        ]}
      />
      <T x={46 + (bMm / xmax) * 125} y={178} tone="b">
        ∝ r adentro · ∝ 1/r afuera
      </T>
    </Frame>
  );
}

/** B entre los ejes de una línea de dos alambres con corrientes opuestas. */
function CampoDosAlambres({ p }: { p: Params }) {
  const aMm = v(p, "a");
  const dMm = v(p, "d") * 10;
  const B = (xMm: number) =>
    (solidWireField(1, aMm / 1000, xMm / 1000) +
      solidWireField(1, aMm / 1000, (dMm - xMm) / 1000)) *
    1e6;
  const ymax = B(aMm) * 1.15;
  return (
    <Frame
      label="Campo B por unidad de corriente a lo largo de la recta que une los ejes de dos alambres con corrientes opuestas"
      h={185}
    >
      <Plot
        ox={46}
        oy={24}
        w={250}
        h={108}
        xmax={dMm}
        ymax={ymax}
        fn={B}
        xlabel="mm"
        ylabel="B / I (µT/A)"
        vlines={[
          { x: aMm, label: "a" },
          { x: dMm - aMm, label: "d − a" },
        ]}
      />
      <T x={46 + 125} y={178} tone="b">
        área entre a y d − a = flujo externo
      </T>
    </Frame>
  );
}

interface AttenPanel {
  ox: number;
  title: string;
  /** α en Np por unidad del eje x. */
  alpha: number;
  unit: string;
  /** Punto objetivo: la amplitud relativa y buscada. */
  targetY: number;
  targetLabel: string;
  marks?: { x: number; label: string; dy?: number }[];
}

function AttenPlot({
  ox,
  title,
  alpha,
  unit,
  targetY,
  targetLabel,
  marks = [],
}: AttenPanel) {
  const xt = -Math.log(targetY) / alpha;
  const xmax = xt * 1.8;
  return (
    <Plot
      ox={ox}
      oy={30}
      w={100}
      h={96}
      xmax={xmax}
      ymax={1}
      fn={(x) => Math.exp(-alpha * x)}
      xlabel={unit}
      ylabel="E/E₀"
      title={title}
      dots={[
        { x: xt, y: targetY, label: targetLabel, dy: -10 },
        ...marks.map((m) => ({
          x: m.x,
          y: Math.exp(-alpha * m.x),
          label: m.label,
          dy: m.dy ?? -8,
        })),
      ]}
    />
  );
}

/** Decaimiento exponencial e^(−αx) a las dos frecuencias, con la distancia pedida. */
function AtenuacionAgua({ p }: { p: Params }) {
  const sigma = 1 / v(p, "rho");
  const k = v(p, "k");
  const pct = 100 * (1 - 1 / k);
  const x1 = attenuationDistance(
    alphaGoodConductor(sigma, v(p, "f1") * 1e3),
    pct,
  );
  const x2 =
    attenuationDistance(alphaGoodConductor(sigma, v(p, "f2") * 1e6), pct) * 100;
  return (
    <Frame
      label="Amplitud del campo en función de la distancia en el agua para las dos frecuencias, con la distancia en que cae a 1/k"
      h={185}
    >
      <AttenPlot
        ox={34}
        title={`${v(p, "f1")} kHz`}
        alpha={-Math.log(1 / k) / x1}
        unit="m"
        targetY={1 / k}
        targetLabel={`x = ${fmt(x1)} m`}
      />
      <AttenPlot
        ox={186}
        title={`${v(p, "f2")} MHz`}
        alpha={-Math.log(1 / k) / x2}
        unit="cm"
        targetY={1 / k}
        targetLabel={`x = ${fmt(x2)} cm`}
      />
      <T x={160} y={178}>
        E/E₀ = e^(−αx) = 1/{k}
      </T>
    </Frame>
  );
}

/** Decaimiento en el grafito: δ marca el 1/e y z el valor pedido α·z. */
function AtenuacionGrafito({ p }: { p: Params }) {
  const d1 = v(p, "d1");
  const f1 = v(p, "f1");
  const f2 = v(p, "f2");
  const az = v(p, "az");
  const d2 = d1 * Math.sqrt(f1 / (f2 * 1e3));
  // Chequeo de coherencia con la conductividad (solo para el rótulo).
  const sigma = conductivityFromDepth(d1 * 1e-3, f1 * 1e6);
  return (
    <Frame
      label="Amplitud del campo en el grafito en función de la profundidad a las dos frecuencias, con la profundidad de penetración δ y la distancia z"
      h={185}
    >
      <AttenPlot
        ox={34}
        title={`${f1} MHz`}
        alpha={1 / d1}
        unit="mm"
        targetY={Math.exp(-az)}
        targetLabel={`z = ${fmt(az * d1)}`}
        marks={[{ x: d1, label: "δ", dy: -8 }]}
      />
      <AttenPlot
        ox={186}
        title={`${f2} GHz`}
        alpha={1 / d2}
        unit="mm"
        targetY={Math.exp(-az)}
        targetLabel={`z = ${fmt(az * d2)}`}
        marks={[{ x: d2, label: "δ", dy: -8 }]}
      />
      <T x={160} y={178}>
        σ ≈ {fmt(sigma / 1e4)}×10⁴ S/m · δ ∝ 1/√f
      </T>
    </Frame>
  );
}
/** B(r) de un solenoide largo: constante adentro, nulo afuera. */
function CampoSolenoide({ p }: { p: Params }) {
  const b = solenoidField(v(p, "n"), v(p, "I")) * 1e3;
  return (
    <Frame
      label="Campo B en función de la distancia al eje de un solenoide largo: constante adentro y nulo afuera"
      h={185}
    >
      <Plot
        ox={46}
        oy={24}
        w={250}
        h={108}
        xmax={2}
        ymax={b * 1.3}
        fn={(x) => (x <= 1 ? b : 0)}
        xlabel="× R"
        ylabel="B (mT)"
        vlines={[{ x: 1, label: "r = R" }]}
        dots={[{ x: 0.5, y: b, label: `B = μ₀nI = ${fmt(b)} mT`, dy: -8 }]}
      />
      <T x={171} y={178} tone="b">
        uniforme adentro · B = 0 afuera
      </T>
    </Frame>
  );
}

/** B(r) de un tubo delgado con corriente superficial: nulo adentro, 1/r afuera. */
function CampoTubo({ p }: { p: Params }) {
  const bMm = v(p, "b");
  const rMm = v(p, "r");
  const B = (x: number) =>
    thinTubeField(v(p, "I"), bMm / 1000, Math.max(x, 1e-6) / 1000) * 1e6;
  const xmax = Math.max(rMm * 1.3, bMm * 3);
  return (
    <Frame
      label="Campo B en función de la distancia al eje de un tubo delgado con corriente superficial: nulo adentro y 1/r afuera"
      h={185}
    >
      <Plot
        ox={46}
        oy={24}
        w={250}
        h={108}
        xmax={xmax}
        ymax={B(bMm) * 1.15}
        fn={B}
        xlabel="mm"
        ylabel="B (µT)"
        vlines={[{ x: bMm, label: "r = b" }]}
        dots={[{ x: rMm, y: B(rMm), label: `${fmt(B(rMm))} µT`, dy: -8 }]}
      />
      <T x={171} y={178} tone="b">
        B = 0 adentro · salto en r = b · ∝ 1/r afuera
      </T>
    </Frame>
  );
}

/** B(r) dentro de un toroide: μ₀NI/2πr entre a y b, nulo afuera. */
function CampoToroide({ p }: { p: Params }) {
  const aMm = v(p, "a");
  const bMm = v(p, "b");
  const rMm = v(p, "r");
  const B = (x: number) =>
    x >= aMm && x <= bMm
      ? toroidField(v(p, "N"), v(p, "I"), x / 1000) * 1e3
      : 0;
  return (
    <Frame
      label="Campo B en función del radio en un toroide: cae como 1/r entre los radios a y b y es nulo afuera"
      h={185}
    >
      <Plot
        ox={46}
        oy={24}
        w={250}
        h={108}
        xmax={bMm * 1.4}
        ymax={B(aMm) * 1.15}
        fn={B}
        xlabel="mm"
        ylabel="B (mT)"
        vlines={[
          { x: aMm, label: "a" },
          { x: bMm, label: "b" },
        ]}
        dots={[{ x: rMm, y: B(rMm), label: `${fmt(B(rMm))} mT`, dy: -8 }]}
      />
      <T x={171} y={178} tone="b">
        ∝ 1/r entre a y b · B = 0 afuera
      </T>
    </Frame>
  );
}

/** Dos alambres con corrientes paralelas: B₁ en el alambre 2 y fuerzas de atracción. */
function FuerzaAlambres({ p }: { p: Params }) {
  const f =
    ((MU0 * v(p, "I1") * v(p, "I2")) / (2 * Math.PI * (v(p, "d") / 100))) * 1e3;
  const x1 = 100;
  const x2 = 220;
  const y = 85;
  return (
    <Frame
      label="Dos alambres paralelos con corrientes en el mismo sentido: el campo del primero sobre el segundo y las fuerzas de atracción"
      h={170}
    >
      <Out x={x1} y={y} r={9} />
      <Out x={x2} y={y} r={9} />
      <T x={x1} y={y - 18} tone="b">
        I₁ = {v(p, "I1")} A
      </T>
      <T x={x2} y={y - 18} tone="b">
        I₂ = {v(p, "I2")} A
      </T>
      <Arrow x1={x2 - 14} y1={y + 50} x2={x2 - 14} y2={y + 22} tone="a" w={2} />
      <T x={x2 - 20} y={y + 40} anchor="end" tone="a">
        B₁ (en 2)
      </T>
      <Arrow x1={x1 + 14} y1={y} x2={x1 + 48} y2={y} w={2.4} />
      <Arrow x1={x2 - 14} y1={y} x2={x2 - 48} y2={y} w={2.4} />
      <T x={x1 + 31} y={y - 6}>
        F₁₂
      </T>
      <T x={x2 - 31} y={y - 6}>
        F₂₁
      </T>
      <Dim x1={x1} y1={140} x2={x2} y2={140} />
      <T x={160} y={156}>
        d = {v(p, "d")} cm
      </T>
      <T x={160} y={28}>
        F/l = {fmt(f)} mN/m · atracción
      </T>
    </Frame>
  );
}

/** Pulso f(x − vt) en dos instantes: se traslada sin deformarse. */
function OndaViajera({ p }: { p: Params }) {
  const vel = C0 / Math.sqrt(v(p, "er") * v(p, "mr"));
  const base = 120;
  const shape = (x0: number) =>
    Array.from({ length: 141 }, (_, k) => {
      const x = 30 + (k / 140) * 260;
      return `${x},${base - 70 * Math.exp(-(((x - x0) / 22) ** 2))}`;
    }).join(" ");
  return (
    <Frame
      label="Pulso f(x − vt) en dos instantes: se desplaza hacia +x una distancia v por Δt sin deformarse"
      h={185}
    >
      <line
        x1={30}
        y1={base}
        x2={292}
        y2={base}
        strokeWidth={1.2}
        className={INK}
      />
      <polyline
        points={shape(95)}
        fill="none"
        strokeWidth={2}
        strokeDasharray="4 3"
        className={SOFT}
      />
      <polyline
        points={shape(215)}
        fill="none"
        strokeWidth={2.2}
        className={WIRE}
      />
      <T x={95} y={base + 16}>
        t = 0
      </T>
      <T x={215} y={base + 16} tone="b">
        t = Δt
      </T>
      <Arrow x1={95} y1={36} x2={215} y2={36} tone="a" w={2} />
      <T x={155} y={28} tone="a">
        v·Δt
      </T>
      <T x={292} y={base + 16} anchor="end">
        x
      </T>
      <T x={160} y={160}>
        v = 1/√(με) = {fmt(vel / 1e8)}×10⁸ m/s
      </T>
    </Frame>
  );
}
function Sub({ a, b }: { a: string; b: string }) {
  return (
    <>
      {a}
      <tspan fontSize={8} dy={3}>
        {b}
      </tspan>
      <tspan dy={-3}>{""}</tspan>
    </>
  );
}

/** Circuito de la guía (#42): fuente AC, capacitor, B alrededor del alambre y lazo de Ampère entre placas. */
function CircuitoCapacitor({ p }: { p: Params }) {
  const i0 =
    displacementCurrentAmplitude(
      v(p, "C") * 1e-9,
      v(p, "V0"),
      2 * Math.PI * v(p, "f") * 1e3,
    ) * 1e3;
  const top = 50;
  const bot = 130;
  const xl = 40;
  const xr = 282;
  const c1 = 168;
  const c2 = 192;
  const sine = Array.from({ length: 25 }, (_, k) => {
    const t = (k / 24) * 2 * Math.PI;
    return `${xl - 10 + (k / 24) * 20},${90 - 5 * Math.sin(t)}`;
  }).join(" ");
  return (
    <Frame
      label="Circuito: fuente alterna conectada a un capacitor de placas paralelas, con el campo B alrededor del alambre y el lazo de Ampère entre las placas"
      h={205}
    >
      <path
        d={`M${xl} 74 V${top} H${c1}`}
        fill="none"
        strokeWidth={2}
        className={WIRE}
      />
      <path
        d={`M${c2} ${top} H${xr} V${bot} H${xl} V106`}
        fill="none"
        strokeWidth={2}
        className={WIRE}
      />
      <circle
        cx={xl}
        cy={90}
        r={16}
        strokeWidth={2}
        className={`${WIRE} fill-white dark:fill-zinc-900`}
      />
      <polyline points={sine} fill="none" strokeWidth={1.4} className={WIRE} />
      <T x={10} y={bot + 30} anchor="start">
        <Sub a="V" b="c" /> = V₀ sen ωt
      </T>
      <line
        x1={c1}
        y1={top - 30}
        x2={c1}
        y2={top + 30}
        strokeWidth={3}
        className={INK}
      />
      <line
        x1={c2}
        y1={top - 30}
        x2={c2}
        y2={top + 30}
        strokeWidth={3}
        className={INK}
      />
      {[-22, -11, 0, 11, 22].map((dy) => (
        <Arrow
          key={dy}
          x1={c1 + 3}
          y1={top + dy}
          x2={c2 - 3}
          y2={top + dy}
          tone="b"
          w={1.2}
        />
      ))}
      <ellipse
        cx={(c1 + c2) / 2}
        cy={top}
        rx={5}
        ry={27}
        fill="none"
        strokeWidth={1.6}
        strokeDasharray="4 3"
        className={FIELD}
      />
      <T x={c1 - 6} y={top - 38} anchor="end">
        C₁
      </T>
      <T x={(c1 + c2) / 2 + 10} y={top + 46} anchor="start" tone="b">
        E, <Sub a="I" b="d" />
      </T>
      <T x={c2 + 4} y={top - 38} anchor="start" tone="a">
        lazo de Ampère
      </T>
      <Arrow x1={70} y1={top} x2={100} y2={top} tone="b" w={2.2} />
      <T x={85} y={top - 8} tone="b">
        I(t)
      </T>
      <ellipse
        cx={124}
        cy={top}
        rx={7}
        ry={17}
        fill="none"
        strokeWidth={1.8}
        className={FIELD}
      />
      <T x={124} y={top - 22} tone="a">
        B
      </T>
      <Arrow x1={218} y1={top} x2={252} y2={top} tone="b" w={2.2} />
      <T x={160} y={bot + 50}>
        <Sub a="I" b="d" /> = <Sub a="I" b="c" /> = C dv/dt · I₀ = Cω V₀ ={" "}
        {fmt(i0)} mA
      </T>
    </Frame>
  );
}
/** E(r) y B(r) de un coaxial en continua, con escalas propias a izquierda y derecha. */
function CamposCoaxial({ p }: { p: Params }) {
  const aMm = v(p, "a");
  const bMm = v(p, "b");
  const rMm = v(p, "r");
  const volts = v(p, "V");
  const cur = v(p, "I");
  const E = (x: number) =>
    x > aMm && x <= bMm ? volts / ((x / 1000) * Math.log(bMm / aMm)) / 1e3 : 0;
  const B = (x: number) =>
    x <= aMm
      ? ((MU0 * cur * (x / 1000)) / (2 * Math.PI * (aMm / 1000) ** 2)) * 1e6
      : x <= bMm
        ? ((MU0 * cur) / (2 * Math.PI * (x / 1000))) * 1e6
        : 0;
  const xmax = bMm * 1.25;
  const emax = E(aMm + 1e-9);
  const bmax = B(aMm);
  const ox = 52;
  const oy = 26;
  const w = 216;
  const h = 108;
  const X = (x: number) => ox + (x / xmax) * w;
  const curve = (fn: (x: number) => number, max: number) =>
    Array.from({ length: 241 }, (_, k) => {
      const x = (k / 240) * xmax;
      return `${X(x)},${oy + h - (fn(x) / max) * h}`;
    }).join(" ");
  return (
    <Frame
      label="Campo eléctrico y densidad de flujo magnético en función del radio en un coaxial, con los radios a y b marcados en el eje horizontal"
      h={185}
    >
      <line
        x1={ox}
        y1={oy + h}
        x2={ox + w}
        y2={oy + h}
        strokeWidth={1.2}
        className={INK}
      />
      <line
        x1={ox}
        y1={oy}
        x2={ox}
        y2={oy + h}
        strokeWidth={1.2}
        className={WIRE}
      />
      <line
        x1={ox + w}
        y1={oy}
        x2={ox + w}
        y2={oy + h}
        strokeWidth={1.2}
        className={FIELD}
      />
      {[
        { x: aMm, label: "r = a" },
        { x: bMm, label: "r = b" },
        { x: rMm, label: "r" },
      ].map((l) => (
        <g key={l.label}>
          <line
            x1={X(l.x)}
            y1={oy}
            x2={X(l.x)}
            y2={oy + h}
            strokeDasharray="3 3"
            className={SOFT}
          />
          <T x={X(l.x)} y={oy + h + 13}>
            {l.label}
          </T>
        </g>
      ))}

      <polyline
        points={curve(B, bmax)}
        fill="none"
        strokeWidth={2}
        className={FIELD}
      />
      <polyline
        points={curve(E, emax)}
        fill="none"
        strokeWidth={2}
        strokeDasharray="7 4"
        className={WIRE}
      />
      <T x={ox - 4} y={oy + 4} anchor="end" tone="b">
        {fmt(emax)}
      </T>
      <T x={ox - 4} y={oy + h} anchor="end">
        0
      </T>
      <T x={ox} y={oy - 8} anchor="start" tone="b">
        E (kV/m)
      </T>
      <T x={ox + w + 4} y={oy + 4} anchor="start" tone="a">
        {fmt(bmax)}
      </T>
      <T x={ox + w} y={oy - 8} anchor="end" tone="a">
        B (µT)
      </T>
      <T x={ox + w} y={oy + h + 26} anchor="end">
        {fmt(xmax)} mm
      </T>
      <T x={160} y={178}>
        E y B ∝ 1/r entre a y b ⇒ P = E×H ∝ 1/r²
      </T>
    </Frame>
  );
}
/** B(r) por amperio en un coaxial: lineal en el conductor interno, 1/r en el dieléctrico y nulo afuera. */
function CampoCoaxialB({ p }: { p: Params }) {
  const aMm = v(p, "a");
  const bMm = v(p, "b");
  const B = (x: number) =>
    x <= aMm
      ? ((MU0 * (x / 1000)) / (2 * Math.PI * (aMm / 1000) ** 2)) * 1e6
      : x <= bMm
        ? (MU0 / (2 * Math.PI * (x / 1000))) * 1e6
        : 0;
  return (
    <Frame
      label="Densidad de flujo magnético en función del radio en un coaxial: lineal hasta r = a, 1/r entre a y b y nula afuera"
      h={185}
    >
      <Plot
        ox={46}
        oy={24}
        w={250}
        h={108}
        xmax={bMm * 1.3}
        ymax={B(aMm) * 1.15}
        fn={B}
        xlabel="mm"
        ylabel="B / I (µT/A)"
        vlines={[
          { x: aMm, label: "r = a" },
          { x: bMm, label: "r = b" },
        ]}
      />
      <T x={171} y={178} tone="b">
        ∝ r en el interno · ∝ 1/r entre a y b · 0 afuera
      </T>
    </Frame>
  );
}
/** E(r) en el cable: una capa (decae como 1/r) frente a tres capas (diente de sierra). */
function CampoCable({ p }: { p: Params }) {
  const a = v(p, "a") / 100;
  const b = v(p, "b") / 100;
  const e = v(p, "E");
  const eps = [6, 4, 2] as const;
  const m = cableMultiLayer(a, b, e * 1e5, eps);
  const one = cableSingleLayer(a, b, e * 1e5, 6);
  const xmax = v(p, "b") * 1.1;
  const single = (x: number) =>
    x >= v(p, "a") && x <= v(p, "b") ? (e * v(p, "a")) / x : 0;
  const multi = (x: number) =>
    cableMultiLayerField(x / 100, a, b, e * 1e5, eps) / 1e5;
  return (
    <Frame
      label="Campo eléctrico en función del radio del cable con una sola capa de aislante y con tres capas"
      h={185}
    >
      <Plot
        ox={34}
        oy={32}
        w={108}
        h={100}
        xmax={xmax}
        ymax={e * 1.15}
        fn={single}
        xlabel="cm"
        ylabel="E (kV/cm)"
        title="una capa"
        vlines={[{ x: v(p, "a"), label: "a" }]}
      />
      <Plot
        ox={186}
        oy={32}
        w={108}
        h={100}
        xmax={xmax}
        ymax={e * 1.15}
        fn={multi}
        xlabel="cm"
        ylabel="E (kV/cm)"
        title="tres capas"
        vlines={[
          { x: m.r1 * 100, label: "r₁" },
          { x: m.r2 * 100, label: "r₂" },
        ]}
      />
      <T x={160} y={178}>
        Vmax: {fmt(one.vmax / 1e3)} kV (una capa) · {fmt(m.vmax / 1e3)} kV
        (tres)
      </T>
    </Frame>
  );
}
/** |E|(r) de la nube esférica: lineal adentro y 1/r² afuera. */
function CampoNube({ p }: { p: Params }) {
  const rho = v(p, "rho0") * 1e-6;
  const bCm = v(p, "b");
  const E = (x: number) => uniformSphereField(rho, bCm / 100, x / 100) / 1e3;
  return (
    <Frame
      label="Módulo del campo en función del radio para la nube esférica: crece linealmente hasta r = b y decae como 1/r²"
      h={185}
    >
      <Plot
        ox={46}
        oy={24}
        w={250}
        h={108}
        xmax={Math.max(v(p, "rout") * 1.1, bCm * 3)}
        ymax={E(bCm) * 1.15}
        fn={E}
        xlabel="cm"
        ylabel="|E| (kV/m)"
        vlines={[{ x: bCm, label: "r = b" }]}
        dots={[
          {
            x: v(p, "rin"),
            y: E(v(p, "rin")),
            label: `${fmt(E(v(p, "rin")))} kV/m`,
            anchor: "end",
            dy: -8,
          },
          {
            x: v(p, "rout"),
            y: E(v(p, "rout")),
            label: `${fmt(E(v(p, "rout")))} kV/m`,
            dy: -8,
          },
        ]}
      />
      <T x={171} y={178} tone="b">
        ∝ r adentro · ∝ 1/r² afuera
      </T>
    </Frame>
  );
}

/** |E|(r) de la capa esférica: nulo adentro, salto en b y 1/r² afuera. */
function CampoCapa({ p }: { p: Params }) {
  const q = v(p, "Q") * 1e-9;
  const bCm = v(p, "b");
  const E = (x: number) => shellField(q, bCm / 100, x / 100);
  return (
    <Frame
      label="Módulo del campo en función del radio para una capa esférica cargada: nulo adentro y 1/r² afuera"
      h={185}
    >
      <Plot
        ox={46}
        oy={24}
        w={250}
        h={108}
        xmax={v(p, "r") * 1.15}
        ymax={E(bCm) * 1.15}
        fn={E}
        xlabel="cm"
        ylabel="|E| (V/m)"
        vlines={[{ x: bCm, label: "r = b" }]}
        dots={[
          {
            x: v(p, "r"),
            y: E(v(p, "r")),
            label: `${fmt(E(v(p, "r")))} V/m`,
            dy: -8,
          },
        ]}
      />
      <T x={171} y={178} tone="b">
        E = 0 adentro · salto en r = b · ∝ 1/r² afuera
      </T>
    </Frame>
  );
}

/** V(r) entre dos capas esféricas: hiperbólico entre Ri y R0, constante en los conductores. */
function PotencialCapas({ p }: { p: Params }) {
  const [v1, v2] = [v(p, "V1"), v(p, "V2")];
  const [ri, r0] = [v(p, "Ri"), v(p, "R0")];
  const V = (x: number) =>
    x <= ri
      ? v1
      : x >= r0
        ? v2
        : sphericalShellPotential(v1, v2, ri / 100, r0 / 100, x / 100).v;
  return (
    <Frame
      label="Potencial en función del radio entre dos capas esféricas conductoras: hiperbólico en el aislante"
      h={185}
    >
      <Plot
        ox={46}
        oy={24}
        w={250}
        h={108}
        xmax={r0 * 1.25}
        ymax={Math.max(v1, v2) * 1.15}
        fn={V}
        xlabel="cm"
        ylabel="V (V)"
        vlines={[
          { x: ri, label: "Rᵢ" },
          { x: r0, label: "R₀" },
        ]}
        dots={[
          {
            x: v(p, "r"),
            y: V(v(p, "r")),
            label: `${fmt(V(v(p, "r")))} V`,
            dy: -8,
          },
        ]}
      />
      <T x={171} y={178} tone="b">
        V = −A/r + B entre las capas
      </T>
    </Frame>
  );
}

const SOLUTION_FIGURES: Record<string, (p: Params) => ReactElement> = {
  g39: (p) => <EspiraPar p={p} />,
  g52: (p) => (
    <>
      <PoyntingCoax p={p} />
      <CamposCoaxial p={p} />
    </>
  ),
  g2: (p) => <CampoNube p={p} />,
  g3: (p) => <CampoCapa p={p} />,
  g14: (p) => <PotencialCapas p={p} />,
  g24: (p) => <CampoCable p={p} />,
  g25: (p) => <CampoConductor p={p} />,
  g26: (p) => <CampoToroide p={p} />,
  g27: (p) => <CampoTubo p={p} />,
  g28: (p) => <CampoSolenoide p={p} />,
  g38: (p) => <FuerzaAlambres p={p} />,
  g42: (p) => <CircuitoCapacitor p={p} />,
  g43: (p) => <OndaViajera p={p} />,
  g36: (p) => <CampoCoaxialB p={p} />,
  g37: (p) => <CampoDosAlambres p={p} />,
  g47: (p) => <AtenuacionAgua p={p} />,
  g50: (p) => <AtenuacionGrafito p={p} />,
  "p-tres-conductores": (p) => <TresConductores p={p} forces />,
};

export const SOLUTION_FIGURE_IDS = Object.keys(SOLUTION_FIGURES);

/** Figura que adelantaría el resultado (fuerzas, par, P): se muestra solo con la resolución. */
export function SolutionFigure({ id, params }: { id: string; params: Params }) {
  const render = SOLUTION_FIGURES[id];
  return render ? render(params) : null;
}
