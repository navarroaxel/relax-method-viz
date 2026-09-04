import type { Metadata } from "next";

import { Lab2Page } from "./Lab2Page";

export const metadata: Metadata = {
  title: "Laboratorio 2 — Medición de la permeabilidad del vacío",
  description:
    "Guía interactiva del ensayo de fuerza entre conductores paralelos: tres curvas F(I), el barrido continuo y el escalón medidos en CASSY, y el μ₀ que se despeja de ellos.",
};

export default function Page() {
  return <Lab2Page />;
}
