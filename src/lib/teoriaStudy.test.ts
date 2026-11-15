import { describe, expect, it } from "vitest";

import {
  countMastered,
  MAX_BOX,
  mulberry32,
  nextBox,
  pickNextCard,
  shuffleSeeded,
} from "./teoriaStudy";

describe("nextBox", () => {
  it("sube una caja al saberla, sin pasar el máximo", () => {
    expect(nextBox(0, "know")).toBe(1);
    expect(nextBox(MAX_BOX, "know")).toBe(MAX_BOX);
  });
  it("mantiene la caja con duda y vuelve a 0 al olvidarla", () => {
    expect(nextBox(3, "doubt")).toBe(3);
    expect(nextBox(3, "forgot")).toBe(0);
  });
});

describe("pickNextCard", () => {
  it("nunca repite la última carta si hay otras", () => {
    const rand = mulberry32(1);
    for (let i = 0; i < 50; i++) {
      expect(pickNextCard(["a", "b", "c"], {}, "b", rand)).not.toBe("b");
    }
  });
  it("prioriza las cartas de cajas bajas", () => {
    const rand = mulberry32(7);
    const boxes = { a: 0, b: MAX_BOX };
    let a = 0;
    for (let i = 0; i < 400; i++) {
      if (
        pickNextCard(["a", "b", "c"], { ...boxes, c: MAX_BOX }, null, rand) ===
        "a"
      )
        a++;
    }
    expect(a).toBeGreaterThan(250);
  });
  it("devuelve null sin cartas y la única carta si hay una", () => {
    expect(pickNextCard([], {}, null, Math.random)).toBeNull();
    expect(pickNextCard(["a"], {}, "a", Math.random)).toBe("a");
  });
});

describe("countMastered", () => {
  it("cuenta solo las de la caja máxima", () => {
    expect(countMastered(["a", "b", "c"], { a: MAX_BOX, b: 2 })).toBe(1);
  });
});

describe("shuffleSeeded", () => {
  it("es determinista y conserva los elementos", () => {
    const xs = [1, 2, 3, 4, 5, 6];
    expect(shuffleSeeded(xs, 3)).toEqual(shuffleSeeded(xs, 3));
    expect([...shuffleSeeded(xs, 3)].sort()).toEqual(xs);
  });
  it("nunca devuelve el orden original", () => {
    const xs = [1, 2, 3];
    for (let seed = 0; seed < 100; seed++) {
      expect(shuffleSeeded(xs, seed)).not.toEqual(xs);
    }
  });
});
