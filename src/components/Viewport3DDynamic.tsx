"use client";

import dynamic from "next/dynamic";

export const Viewport3D = dynamic(
  () => import("./Viewport3D").then((m) => m.Viewport3D),
  { ssr: false },
);
