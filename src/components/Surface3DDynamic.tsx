"use client";

import dynamic from "next/dynamic";

export const Surface3D = dynamic(() => import("./Surface3D"), { ssr: false });
