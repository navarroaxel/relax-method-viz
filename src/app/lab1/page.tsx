import type { Metadata } from "next";

import { Lab1Page } from "./Lab1Page";

export const metadata: Metadata = {
  title: "Laboratorio 1 — Fuerzas entre corrientes y campos magnéticos",
  description:
    "Guía interactiva del ensayo de fuerza sobre un conductor en un solenoide, con el registro de escalón medido en CASSY.",
};

export default function Page() {
  return <Lab1Page />;
}
