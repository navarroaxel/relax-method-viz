"use client";

import katex from "katex";
import "katex/dist/katex.min.css";

function render(tex: string, display: boolean): string {
  return katex.renderToString(tex, {
    displayMode: display,
    throwOnError: false,
    strict: "ignore",
  });
}

export function Tex({ tex, block = false }: { tex: string; block?: boolean }) {
  return (
    <span
      className={block ? "block overflow-x-auto py-1 text-center" : undefined}
      dangerouslySetInnerHTML={{ __html: render(tex, block) }}
    />
  );
}

/** Texto con matemática en línea entre `$...$`. */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\$([^$]+)\$/)
        .map((part, i) =>
          i % 2 === 1 ? (
            <Tex key={i} tex={part} />
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
    </>
  );
}
