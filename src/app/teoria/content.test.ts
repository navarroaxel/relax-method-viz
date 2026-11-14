import { describe, expect, it } from "vitest";

import { CARDS, QUIZ } from "./content";

describe("QUIZ", () => {
  it("referencia tarjetas existentes y tiene ids únicos", () => {
    const cards = new Set(CARDS.map((c) => c.id));
    expect(new Set(QUIZ.map((q) => q.id)).size).toBe(QUIZ.length);
    for (const q of QUIZ) expect(cards.has(q.cardId)).toBe(true);
  });
  it("cada pregunta tiene 4 opciones distintas y no vacías", () => {
    for (const q of QUIZ) {
      expect(q.options).toHaveLength(4);
      const keys = q.options.map((o) => o.tex ?? o.text ?? "");
      expect(keys.every((k) => k.length > 0)).toBe(true);
      expect(new Set(keys).size).toBe(4);
    }
  });
});
