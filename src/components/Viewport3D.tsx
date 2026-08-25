"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Canvas as R3FCanvas, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import * as THREE from "three";
import { useLanguage } from "@/contexts/LanguageContext";
import { idx3 } from "@/lib/grid3d";
import {
  computeSliceContours,
  computeStreamlines3D,
  paintSliceRGBA,
  sampleSlice,
} from "@/lib/rendering3d";
import { divergentColor } from "@/lib/colormap";
import type {
  Grid3DState,
  Primitive3D,
  SliceAxis,
  Tool3D,
} from "@/types/grid3d";

export interface Viewport3DProps {
  grid: Grid3DState;
  renderTick: number; // bumps every solver progress event
  conductorVersion: number; // bumps when fixed/Vfix change
  vmax: number;
  tool: Tool3D;
  voltage: number;
  thickness: number; // voxel radius / extent for wire / cylinder / plate-depth
  radius: number; // sphere & cylinder radius (voxels)
  sliceAxis: SliceAxis;
  sliceIndex: number;
  setSliceIndex: Dispatch<SetStateAction<number>>;
  showEquipotentials: boolean;
  showFieldLines: boolean;
  onCommitPrimitive: (prim: Primitive3D, erase: boolean) => void;
}

const HALF = 0.5;

// World position of cell-center (i + 0.5, j + 0.5, k + 0.5) on a 1x1x1 cube
// centered at origin. cellSize = 1/N.
function cellToWorld(
  i: number,
  j: number,
  k: number,
  N: number,
  out = new THREE.Vector3(),
): THREE.Vector3 {
  const s = 1 / N;
  return out.set(
    (i + 0.5) * s - HALF,
    (j + 0.5) * s - HALF,
    (k + 0.5) * s - HALF,
  );
}

// World hit point on a slice plane → integer (i, j, k) cell coords. The
// `axis` and `axisIndex` determine the fixed coordinate; the other two come
// from the world position.
function pointToCell(
  point: THREE.Vector3,
  N: number,
  axis: SliceAxis,
  axisIndex: number,
): [number, number, number] {
  const toCell = (w: number) =>
    Math.max(0, Math.min(N - 1, Math.floor((w + HALF) * N)));
  const i = toCell(point.x);
  const j = toCell(point.y);
  const k = toCell(point.z);
  if (axis === "x") return [axisIndex, j, k];
  if (axis === "y") return [i, axisIndex, k];
  return [i, j, axisIndex];
}

// World coordinate of the slice plane along its normal axis.
function sliceWorldPos(N: number, index: number): number {
  return (Math.max(0, Math.min(N - 1, index)) + 0.5) / N - HALF;
}

interface SlicePlaneProps {
  N: number;
  axis: SliceAxis;
  index: number;
  V: Float32Array;
  vmax: number;
  renderTick: number;
  showEquipotentials: boolean;
  onDown: (e: ThreeEvent<PointerEvent>) => void;
  onMove: (e: ThreeEvent<PointerEvent>) => void;
  onUp: (e: ThreeEvent<PointerEvent>) => void;
}

interface SliceResources {
  canvas: HTMLCanvasElement;
  image: ImageData;
  texture: THREE.CanvasTexture;
}

function paintSliceResources(
  res: SliceResources,
  N: number,
  V: Float32Array,
  axis: SliceAxis,
  index: number,
  vmax: number,
): void {
  const slice = sampleSlice({ N, V } as Grid3DState, axis, index);
  paintSliceRGBA(slice, N, vmax, res.image.data);
  const ctx = res.canvas.getContext("2d");
  if (!ctx) return;
  ctx.putImageData(res.image, 0, 0);
  res.texture.needsUpdate = true;
}

interface ContourResources {
  geometry: THREE.BufferGeometry;
  positions: Float32Array;
  // Pre-allocated upper bound for segment vertices (3 floats per vertex).
  capacity: number;
}

function updateContourResources(
  res: ContourResources,
  N: number,
  V: Float32Array,
  axis: SliceAxis,
  index: number,
  vmax: number,
): void {
  const slice = sampleSlice({ N, V } as Grid3DState, axis, index);
  const segs = computeSliceContours(slice, N, vmax);
  const n = Math.min(segs.length, res.capacity);
  res.positions.set(segs.subarray(0, n));
  const attr = res.geometry.attributes.position as THREE.BufferAttribute;
  attr.needsUpdate = true;
  res.geometry.setDrawRange(0, n / 3);
}

function SlicePlane({
  N,
  axis,
  index,
  V,
  vmax,
  renderTick,
  showEquipotentials,
  onDown,
  onMove,
  onUp,
}: SlicePlaneProps) {
  // useMemo holds the per-N Three.js resources. Mirroring Surface3D, we
  // access fields through the resources object (e.g. `resources.texture`)
  // rather than destructuring — the immutability lint rule only flags
  // mutation of direct identifiers from hook returns.
  const resources = useMemo<SliceResources>(() => {
    const c = document.createElement("canvas");
    c.width = N;
    c.height = N;
    const ctx = c.getContext("2d");
    const image =
      ctx?.createImageData(N, N) ??
      ({
        data: new Uint8ClampedArray(N * N * 4),
        width: N,
        height: N,
      } as ImageData);
    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, image, texture: tex };
  }, [N]);

  // Pre-allocate the contour buffer once per N. 13 levels × ~N² cells × ~2
  // segments × 2 endpoints × 3 floats is the upper bound; in practice we
  // use far less. 64 floats per cell is a generous ceiling.
  const contours = useMemo<ContourResources>(() => {
    const capacity = N * N * 64;
    const positions = new Float32Array(capacity);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setDrawRange(0, 0);
    return { geometry, positions, capacity };
  }, [N]);

  useEffect(() => {
    return () => {
      resources.texture.dispose();
      contours.geometry.dispose();
    };
  }, [resources, contours]);

  useEffect(() => {
    paintSliceResources(resources, N, V, axis, index, vmax);
    if (showEquipotentials) {
      updateContourResources(contours, N, V, axis, index, vmax);
    } else {
      contours.geometry.setDrawRange(0, 0);
    }
    // V is mutated in place; renderTick is the change signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    renderTick,
    axis,
    index,
    N,
    vmax,
    resources,
    contours,
    showEquipotentials,
  ]);

  // Position & orient the plane so its normal is along `axis`.
  const w = sliceWorldPos(N, index);
  const rotation: [number, number, number] =
    axis === "x"
      ? [Math.PI / 2, 0, Math.PI / 2]
      : axis === "y"
        ? [Math.PI / 2, 0, 0]
        : [0, 0, 0];
  const position: [number, number, number] =
    axis === "x" ? [w, 0, 0] : axis === "y" ? [0, w, 0] : [0, 0, w];

  return (
    <group position={position} rotation={rotation}>
      <mesh onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial
          map={resources.texture}
          side={THREE.DoubleSide}
          transparent
          opacity={0.92}
        />
      </mesh>
      {showEquipotentials && (
        <lineSegments
          geometry={contours.geometry}
          position={[0, 0, 0.0005]}
          renderOrder={2}
        >
          <lineBasicMaterial
            color="#000"
            transparent
            opacity={0.55}
            depthTest={false}
          />
        </lineSegments>
      )}
    </group>
  );
}

// Instanced mesh of voxel boxes for every fixed cell. Rebuilds when
// conductorVersion changes.
interface VoxelInstancesProps {
  grid: Grid3DState;
  conductorVersion: number;
}

function VoxelInstances({ grid, conductorVersion }: VoxelInstancesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tmpObj = useMemo(() => new THREE.Object3D(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);
  const cellSize = 1 / grid.N;
  // Cap instance count to avoid hogging VRAM on very dense geometries.
  const MAX_INSTANCES = 80000;

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const { N, fixed, Vfix } = grid;
    // Compute current vmax of fixed values for color scaling.
    let vmaxFixed = 0;
    for (let p = 0; p < Vfix.length; p++) {
      const a = Math.abs(Vfix[p] as number);
      if (a > vmaxFixed) vmaxFixed = a;
    }
    if (vmaxFixed === 0) vmaxFixed = 1;
    let count = 0;
    for (let i = 1; i < N - 1 && count < MAX_INSTANCES; i++) {
      for (let j = 1; j < N - 1 && count < MAX_INSTANCES; j++) {
        for (let k = 1; k < N - 1 && count < MAX_INSTANCES; k++) {
          const p = idx3(i, j, k, N);
          if (fixed[p] !== 1) continue;
          cellToWorld(i, j, k, N, tmpObj.position);
          tmpObj.scale.setScalar(1);
          tmpObj.rotation.set(0, 0, 0);
          tmpObj.updateMatrix();
          mesh.setMatrixAt(count, tmpObj.matrix);
          const vp = Vfix[p] as number;
          if (vp === 0) {
            tmpColor.setRGB(1, 0.84, 0);
          } else {
            const [r, g, b] = divergentColor(vp, vmaxFixed);
            tmpColor.setRGB(r / 255, g / 255, b / 255);
          }
          mesh.setColorAt(count, tmpColor);
          count++;
        }
      }
    }
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    // grid arrays are mutated in place; conductorVersion is the change signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conductorVersion, grid.N, tmpObj, tmpColor]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, MAX_INSTANCES]}
      frustumCulled={false}
    >
      <boxGeometry args={[cellSize, cellSize, cellSize]} />
      <meshStandardMaterial roughness={0.6} />
    </instancedMesh>
  );
}

// 3D E-field streamlines through the entire volume. Single LineSegments
// mesh with a pre-allocated buffer; recomputed on renderTick changes (E
// follows V, which is mutated in place on every solver tick).
interface FieldLinesProps {
  grid: Grid3DState;
  renderTick: number;
  visible: boolean;
}

interface FieldLinesResources {
  geometry: THREE.BufferGeometry;
  positions: Float32Array;
  capacity: number;
}

function updateFieldLinesGeometry(
  res: FieldLinesResources,
  grid: Grid3DState,
): void {
  const segs = computeStreamlines3D(grid);
  const n = Math.min(segs.length, res.capacity);
  res.positions.set(segs.subarray(0, n));
  const attr = res.geometry.attributes.position as THREE.BufferAttribute;
  attr.needsUpdate = true;
  res.geometry.setDrawRange(0, n / 3);
}

function FieldLines({ grid, renderTick, visible }: FieldLinesProps) {
  // Capacity is independent of N — sized for the largest grid we'd render.
  const resources = useMemo<FieldLinesResources>(() => {
    // 200 000 line segments × 2 endpoints × 3 floats = 1.2M floats (~4.8MB).
    const capacity = 1_200_000;
    const positions = new Float32Array(capacity);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setDrawRange(0, 0);
    return { geometry, positions, capacity };
  }, []);

  useEffect(() => {
    return () => {
      resources.geometry.dispose();
    };
  }, [resources]);

  useEffect(() => {
    if (visible) updateFieldLinesGeometry(resources, grid);
    else resources.geometry.setDrawRange(0, 0);
    // grid.V is mutated in place; renderTick is the change signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderTick, visible, resources]);

  if (!visible) return null;
  return (
    <lineSegments geometry={resources.geometry} renderOrder={1}>
      <lineBasicMaterial color="#0aa" transparent opacity={0.6} depthTest />
    </lineSegments>
  );
}

// Wireframe of the [-0.5, +0.5]³ domain.
function DomainBounds() {
  return (
    <lineSegments>
      <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
      <lineBasicMaterial color="#888" />
    </lineSegments>
  );
}

// Ghost line shown between the first click anchor and the live pointer
// position while the user is mid-primitive.
function GhostLine({
  a,
  b,
}: {
  a: [number, number, number];
  b: [number, number, number];
}) {
  return (
    <Line
      points={[a, b]}
      color="yellow"
      lineWidth={2}
      dashed
      dashSize={0.02}
      gapSize={0.02}
    />
  );
}

interface AnchorState {
  cell: [number, number, number];
  worldPoint: THREE.Vector3;
}

export function Viewport3D({
  grid,
  renderTick,
  conductorVersion,
  vmax,
  tool,
  voltage,
  thickness,
  radius,
  sliceAxis,
  sliceIndex,
  setSliceIndex,
  showEquipotentials,
  showFieldLines,
  onCommitPrimitive,
}: Viewport3DProps) {
  const { t } = useLanguage();
  const [anchor, setAnchor] = useState<AnchorState | null>(null);
  const [cursor, setCursor] = useState<THREE.Vector3 | null>(null);
  const drawingRef = useRef(false);

  const isErase = tool === "era";
  const effectiveVoltage = isErase ? 0 : voltage;

  const commit = (b: [number, number, number]) => {
    if (!anchor) return;
    const a = anchor.cell;
    const N = grid.N;
    // Clamp endpoints into the [1, N-2] interior so primitives never sit on
    // the boundary row where applyBoundary3D would overwrite them.
    const clamp = (p: [number, number, number]): [number, number, number] => [
      Math.max(1, Math.min(N - 2, p[0])),
      Math.max(1, Math.min(N - 2, p[1])),
      Math.max(1, Math.min(N - 2, p[2])),
    ];
    const aa = clamp(a);
    const bb = clamp(b);
    let prim: Primitive3D;
    switch (tool) {
      case "wire":
        prim = {
          kind: "wire",
          a: aa,
          b: bb,
          thickness,
          voltage: effectiveVoltage,
        };
        break;
      case "plate": {
        // Extend the plate perpendicular to the slice plane by ±thickness/2.
        const half = Math.max(0, Math.floor(thickness / 2));
        const aDepth: [number, number, number] = [aa[0], aa[1], aa[2]];
        const bDepth: [number, number, number] = [bb[0], bb[1], bb[2]];
        if (sliceAxis === "x") {
          aDepth[0] = Math.max(1, aa[0] - half);
          bDepth[0] = Math.min(N - 2, bb[0] + half);
        } else if (sliceAxis === "y") {
          aDepth[1] = Math.max(1, aa[1] - half);
          bDepth[1] = Math.min(N - 2, bb[1] + half);
        } else {
          aDepth[2] = Math.max(1, aa[2] - half);
          bDepth[2] = Math.min(N - 2, bb[2] + half);
        }
        prim = {
          kind: "plate",
          a: aDepth,
          b: bDepth,
          voltage: effectiveVoltage,
        };
        break;
      }
      case "sphere": {
        const dx = bb[0] - aa[0];
        const dy = bb[1] - aa[1];
        const dz = bb[2] - aa[2];
        const r = Math.max(
          1,
          Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz)),
        );
        prim = {
          kind: "sphere",
          center: aa,
          radius: r,
          voltage: effectiveVoltage,
        };
        break;
      }
      case "cylinder":
        prim = {
          kind: "cylinder",
          a: aa,
          b: bb,
          radius,
          voltage: effectiveVoltage,
        };
        break;
      case "era":
        // Erase = plate-shaped wipe between the two clicks.
        prim = { kind: "plate", a: aa, b: bb, voltage: 0 };
        break;
    }
    onCommitPrimitive(prim, isErase);
    setAnchor(null);
    setCursor(null);
    drawingRef.current = false;
  };

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const cell = pointToCell(e.point, grid.N, sliceAxis, sliceIndex);
    if (!anchor) {
      const target = e.target as Element | undefined;
      target?.setPointerCapture?.(e.pointerId);
      drawingRef.current = true;
      setAnchor({ cell, worldPoint: e.point.clone() });
      setCursor(e.point.clone());
    } else {
      commit(cell);
      const target = e.target as Element | undefined;
      target?.releasePointerCapture?.(e.pointerId);
    }
  };

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!anchor) return;
    setCursor(e.point.clone());
  };

  const onUp = () => {
    // Two-click model — actual commit happens on the second pointerdown.
  };

  // Escape cancels the pending second click.
  useEffect(() => {
    if (!anchor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setAnchor(null);
      setCursor(null);
      drawingRef.current = false;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [anchor]);

  // Camera-relative starting position so the entire domain is in view.
  const camPos: [number, number, number] = [1.4, 1.1, 1.4];

  // Anchor in world coords for ghost line.
  const ghostA: [number, number, number] | null = anchor
    ? [anchor.worldPoint.x, anchor.worldPoint.y, anchor.worldPoint.z]
    : null;
  const ghostB: [number, number, number] | null = cursor
    ? [cursor.x, cursor.y, cursor.z]
    : null;

  return (
    <div className="relative h-[480px] w-full max-w-[640px] overflow-hidden rounded-md border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <R3FCanvas camera={{ position: camPos, fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 2, 2]} intensity={0.7} />
        <DomainBounds />
        <axesHelper args={[0.6]} />
        <VoxelInstances grid={grid} conductorVersion={conductorVersion} />
        <FieldLines
          grid={grid}
          renderTick={renderTick}
          visible={showFieldLines}
        />
        <SlicePlane
          N={grid.N}
          axis={sliceAxis}
          index={sliceIndex}
          V={grid.V}
          vmax={vmax}
          renderTick={renderTick}
          showEquipotentials={showEquipotentials}
          onDown={onDown}
          onMove={onMove}
          onUp={onUp}
        />
        {ghostA && ghostB && <GhostLine a={ghostA} b={ghostB} />}
        <OrbitControls makeDefault enableDamping enabled={anchor === null} />
      </R3FCanvas>
      {/* Slice index slider overlay */}
      <div className="pointer-events-auto absolute right-2 bottom-2 left-2 flex items-center gap-2 rounded-md border border-zinc-300 bg-white/90 px-2 py-1 text-xs text-zinc-700 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-200">
        <span className="font-mono">
          slice {sliceAxis} = {sliceIndex}
        </span>
        <input
          type="range"
          min={0}
          max={grid.N - 1}
          step={1}
          value={sliceIndex}
          onChange={(e) => setSliceIndex(parseInt(e.target.value, 10))}
          className="flex-1"
        />
      </div>
      {anchor && (
        <div className="pointer-events-none absolute top-2 left-2 rounded-md border border-yellow-400 bg-yellow-100/90 px-2 py-1 font-mono text-[11px] leading-tight text-yellow-900 shadow-sm">
          {t("viewport3d.anchor_hint")}
        </div>
      )}
    </div>
  );
}
