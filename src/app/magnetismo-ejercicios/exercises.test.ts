import { describe, expect, it } from "vitest";

import { mulberry32 } from "@/lib/teoriaStudy";

import { EXERCISES } from "./exercises";

const balanced = (s: string) => (s.match(/\$/g)?.length ?? 0) % 2 === 0;

describe("EXERCISES", () => {
  it("tienen ids únicos y estrategia de 4 opciones", () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
    for (const e of EXERCISES) expect(e.strategy.options).toHaveLength(4);
  });

  it("con datos originales y variantes dan resultados finitos y pasos completos", () => {
    const rand = mulberry32(42);
    for (const e of EXERCISES) {
      const sets = [
        e.original,
        ...Array.from({ length: 100 }, () => e.vary(rand)),
      ];
      for (const p of sets) {
        for (const f of e.fields(p)) {
          expect(Number.isFinite(f.value), `${e.id} ${f.label}`).toBe(true);
        }
        const steps = e.steps(p);
        expect(steps.length).toBeGreaterThan(0);
        expect(balanced(e.statement(p)), `${e.id} enunciado`).toBe(true);
        for (const s of steps) {
          expect(balanced(s.hint), `${e.id} pista`).toBe(true);
          expect(balanced(s.body ?? ""), `${e.id} cuerpo`).toBe(true);
          expect(s.tex ?? "").not.toMatch(/NaN|Infinity|undefined/);
        }
      }
    }
  });

  it("los datos originales de los parciales reproducen los resultados del PDF", () => {
    const get = (id: string) => {
      const e = EXERCISES.find((x) => x.id === id);
      if (!e) throw new Error(id);
      return e.fields(e.original);
    };
    expect(get("p-helmholtz")[0]?.value).toBeCloseTo(37.1, 1);
    expect(get("p-atenuacion")[1]?.value).toBeCloseTo(0.366, 2);
    expect(get("p-fem-hilo")[1]?.value).toBeCloseTo(26.1, 1);
    expect(get("p-tres-conductores")[1]?.value).toBeCloseTo(2.17, 2);
    expect(get("g47")[0]?.value).toBeCloseTo(3, 0);
    expect(get("g48")[2]?.value).toBeCloseTo(89.9, 1);
    expect(get("g50")[0]?.value).toBeCloseTo(9.9, 1);
    expect(get("g50")[1]?.value).toBeCloseTo(0.175, 3);
  });
});
