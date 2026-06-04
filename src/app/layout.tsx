import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./Providers";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Campo Eléctrico — Método de Relax",
  description:
    "Simulador interactivo del campo electrostático por el método relax (SOR).",
};

// Runs before React hydrates so the page paints with the right theme on
// first frame and avoids a light→dark flash.
const themeInitScript = `
(function () {
  try {
    var pref = localStorage.getItem("theme");
    var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var useDark = pref === "dark" || (pref !== "light" && systemDark);
    if (useDark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

// Runs before paint. Decides the active language from localStorage or the
// browser, sets <html lang>, and — if it differs from the build default
// (Spanish, baked into the static export) — sets data-lang-pending so CSS
// hides the body until React rehydrates with the right translations. The
// LanguageProvider clears the attribute once mounted. Without this, English
// users would see a flash of Spanish content before hydration commits.
const langInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("language");
    var lang;
    if (stored === "en" || stored === "es") {
      lang = stored;
    } else {
      lang = (navigator.language || "").toLowerCase().indexOf("es") === 0 ? "es" : "en";
    }
    document.documentElement.lang = lang;
    if (lang !== "es") {
      document.documentElement.setAttribute("data-lang-pending", "1");
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: langInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
