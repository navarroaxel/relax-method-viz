import type { Metadata } from "next";

import { TeoriaPage } from "./TeoriaPage";

export const metadata: Metadata = {
  title: "Teoría — repaso para el parcial",
  description:
    "Tarjetas, deducciones para ordenar y ejercicios de emparejar para memorizar los postulados del electromagnetismo.",
};

export default function Page() {
  return <TeoriaPage />;
}
