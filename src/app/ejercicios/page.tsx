import type { Metadata } from "next";

import { EjerciciosPage } from "./EjerciciosPage";

export const metadata: Metadata = {
  title: "Ejercicios — práctica para el parcial",
  description:
    "Ejercicios de parciales 2P y de la guía de TdC con datos que cambian: resolvelos, verificá el resultado y mirá la resolución paso a paso.",
};

export default function Page() {
  return <EjerciciosPage />;
}
