"use client";

import { useEffect, useMemo } from "react";
import { Canvas as R3FCanvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { divergentColor } from "@/lib/colormap";
import { idx } from "@/lib/grid";
import type { GridState } from "@/types";

interface Surface3DProps {
  grid: GridState;
  renderTick: number;
  vmax: number;
}

const HEIGHT_SCALE = 0.4;

function buildSurfaceGeometry(N: number): THREE.PlaneGeometry {
  const g = new THREE.PlaneGeometry(1, 1, N - 1, N - 1);
  g.rotateX(-Math.PI / 2);
  const colors = new Float32Array(N * N * 3);
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return g;
}

function updateSurfaceGeometry(
  geo: THREE.PlaneGeometry,
  V: Float32Array,
  N: number,
  vmax: number,
): void {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const col = geo.attributes.color as THREE.BufferAttribute;
  const posArr = pos.array as Float32Array;
  const colArr = col.array as Float32Array;
  const vmaxSafe = vmax > 0 ? vmax : 1;
  for (let r = 0; r < N * N; r++) {
    const xCol = r % N;
    const yRow = (r - xCol) / N;
    const v = V[idx(xCol, yRow, N)] as number;
    posArr[3 * r + 1] = (v / vmaxSafe) * HEIGHT_SCALE;
    const [cr, cg, cb] = divergentColor(v, vmaxSafe);
    colArr[3 * r] = cr / 255;
    colArr[3 * r + 1] = cg / 255;
    colArr[3 * r + 2] = cb / 255;
  }
  pos.needsUpdate = true;
  col.needsUpdate = true;
  geo.computeVertexNormals();
}

function Surface({ grid, renderTick, vmax }: Surface3DProps) {
  const geo = useMemo(() => buildSurfaceGeometry(grid.N), [grid.N]);

  useEffect(() => {
    return () => {
      geo.dispose();
    };
  }, [geo]);

  // grid.V is mutated in place; renderTick is the change signal.
  useEffect(() => {
    updateSurfaceGeometry(geo, grid.V, grid.N, vmax);
    // grid.V identity is stable; we depend on renderTick instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo, grid.N, renderTick, vmax]);

  return (
    <mesh geometry={geo}>
      <meshStandardMaterial
        vertexColors
        side={THREE.DoubleSide}
        roughness={0.6}
      />
    </mesh>
  );
}

export default function Surface3D(props: Surface3DProps) {
  return (
    <div className="h-[360px] w-[480px] overflow-hidden rounded-md border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <R3FCanvas camera={{ position: [1.0, 0.9, 1.0], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 2, 2]} intensity={0.8} />
        <Surface {...props} />
        <axesHelper args={[0.6]} />
        <OrbitControls enableDamping />
      </R3FCanvas>
    </div>
  );
}
