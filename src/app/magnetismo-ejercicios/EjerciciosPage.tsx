"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { GitHubLink } from "@/components/GitHubLink";
import { ProjectCredits } from "@/components/ProjectCredits";
import { checkAnswer, parseNumber } from "@/lib/teoriaExercises";
import { shuffleSeeded } from "@/lib/teoriaStudy";

import { Rich, Tex } from "../magnetismo-teoria/Tex";
import { EXERCISES, type Exercise, type Params } from "./exercises";
import { ExerciseFigure } from "./Figures";

const CARD =
  "rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900";
const BTN =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800";
const BTN_PRIMARY =
  "rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40";
const BODY = "text-sm leading-relaxed text-zinc-600 dark:text-zinc-300";

type Group = "parciales" | "guia";

const GROUPS: { id: Group; label: string }[] = [
  { id: "parciales", label: "Parciales 2P" },
  { id: "guia", label: "Guía (25 en adelante)" },
];

function ExerciseView({ exercise }: { exercise: Exercise }) {
  const [params, setParams] = useState<Params>(exercise.original);
  const [variant, setVariant] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [inputs, setInputs] = useState<string[]>([]);
  const [results, setResults] = useState<boolean[] | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  const fields = useMemo(() => exercise.fields(params), [exercise, params]);
  const steps = useMemo(() => exercise.steps(params), [exercise, params]);
  const strategyOrder = useMemo(
    () =>
      shuffleSeeded(
        exercise.strategy.options.map((_, i) => i),
        variant * 13 + exercise.id.length + 5,
      ),
    [exercise, variant],
  );

  const allOk = results !== null && results.every(Boolean);

  const newVariant = () => {
    setParams(exercise.vary(Math.random));
    setVariant((v) => v + 1);
    setPicked(null);
    setInputs([]);
    setResults(null);
    setRevealed(0);
    setShowSolution(false);
  };
  const original = () => {
    setParams(exercise.original);
    setVariant(0);
    setPicked(null);
    setInputs([]);
    setResults(null);
    setRevealed(0);
    setShowSolution(false);
  };
  const check = () => {
    setResults(
      fields.map((f, i) =>
        checkAnswer(inputs[i] ?? "", {
          value: f.value,
          alt: f.alt,
          relTol: f.relTol,
          absTol: f.absTol,
        }),
      ),
    );
  };

  return (
    <section className={`${CARD} flex flex-col gap-3`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {exercise.source}
        </span>
        <div className="flex gap-2">
          <button type="button" className={BTN} onClick={newVariant}>
            Cambiar datos
          </button>
          {variant > 0 && (
            <button type="button" className={BTN} onClick={original}>
              Datos originales
            </button>
          )}
        </div>
      </div>

      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        {exercise.title}
      </h2>
      <p className={BODY}>
        <Rich text={exercise.statement(params)} />
      </p>
      <ExerciseFigure id={exercise.id} params={params} />
      {exercise.note && (
        <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {exercise.note}
        </p>
      )}

      <div className="flex flex-col gap-2 rounded-md border border-zinc-200 p-2 dark:border-zinc-700">
        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Antes de calcular: <Rich text={exercise.strategy.prompt} />
        </div>
        {strategyOrder.map((o) => {
          const answered = picked !== null;
          const right = o === 0;
          const style = !answered
            ? "border-zinc-300 hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
            : right
              ? "border-green-400 bg-green-50 dark:border-green-700 dark:bg-green-950/40"
              : o === picked
                ? "border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/40"
                : "border-zinc-200 opacity-60 dark:border-zinc-700";
          return (
            <button
              key={o}
              type="button"
              disabled={answered}
              onClick={() => setPicked(o)}
              className={`rounded-md border p-2 text-left text-sm text-zinc-700 dark:text-zinc-200 ${style}`}
            >
              <Rich text={exercise.strategy.options[o] ?? ""} />
            </button>
          );
        })}
        {picked !== null && (
          <p className={BODY}>
            <strong>{picked === 0 ? "¡Correcto! " : "No era esa. "}</strong>
            <Rich text={exercise.strategy.explain} />
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {fields.map((f, i) => (
          <label
            key={f.label}
            className="flex flex-wrap items-center gap-2 text-sm"
          >
            <span className="min-w-48 text-zinc-700 dark:text-zinc-200">
              {f.label}
            </span>
            <input
              inputMode="decimal"
              value={inputs[i] ?? ""}
              onChange={(e) => {
                const next = [...inputs];
                next[i] = e.target.value;
                setInputs(next);
                setResults(null);
              }}
              className={`w-36 rounded-md border bg-white px-2 py-1 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 ${
                results === null
                  ? "border-zinc-300 dark:border-zinc-600"
                  : results[i]
                    ? "border-green-500"
                    : "border-red-500"
              }`}
              placeholder="tu resultado"
            />
            <span className="text-zinc-500 dark:text-zinc-400">{f.unit}</span>
            {results !== null &&
              (results[i] ? (
                <span className="text-green-600 dark:text-green-400">✓</span>
              ) : (
                <span className="text-xs text-red-600 dark:text-red-400">
                  {parseNumber(inputs[i] ?? "") === null
                    ? "ingresá un número"
                    : "no coincide"}
                </span>
              ))}
          </label>
        ))}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={BTN_PRIMARY}
            onClick={check}
            disabled={fields.length === 0}
          >
            Comprobar
          </button>
          <button
            type="button"
            className={BTN}
            onClick={() => setShowSolution((s) => !s)}
          >
            {showSolution ? "Ocultar resolución" : "Ver resolución"}
          </button>
          {allOk && (
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              ¡Bien resuelto!
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Se acepta un 3 % de diferencia. Podés usar coma decimal o notación
          científica (1e-3).
        </p>
      </div>

      {showSolution && (
        <ol className="flex flex-col gap-2">
          {steps.map((s, i) => {
            const shown = i < revealed;
            return (
              <li
                key={i}
                className={`rounded-md border p-2 ${
                  shown
                    ? "border-zinc-200 dark:border-zinc-700"
                    : "border-dashed border-zinc-300 dark:border-zinc-600"
                }`}
              >
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {i + 1}. <Rich text={s.hint} />
                </div>
                {shown ? (
                  <div className="mt-1 flex flex-col gap-1">
                    {s.tex && <Tex tex={s.tex} block />}
                    {s.body && (
                      <p className={BODY}>
                        <Rich text={s.body} />
                      </p>
                    )}
                  </div>
                ) : i === revealed ? (
                  <button
                    type="button"
                    onClick={() => setRevealed(i + 1)}
                    className="mt-1 text-xs text-blue-700 hover:underline dark:text-blue-400"
                  >
                    Revelar paso
                  </button>
                ) : null}
              </li>
            );
          })}
          {revealed < steps.length && (
            <li>
              <button
                type="button"
                className={BTN}
                onClick={() => setRevealed(steps.length)}
              >
                Revelar todo
              </button>
            </li>
          )}
        </ol>
      )}
    </section>
  );
}

export function EjerciciosPage() {
  const [group, setGroup] = useState<Group>("parciales");
  const list = EXERCISES.filter((e) => e.group === group);
  const [id, setId] = useState(list[0]?.id ?? "");
  const exercise = list.find((e) => e.id === id) ?? list[0];

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-3 p-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Ejercicios — práctica para el parcial
          </h1>
          <GitHubLink />
        </div>
        <p className={BODY}>
          Problemas de parciales 2P y de la guía de TdC (del 25 en adelante,
          solo los resueltos). Cambiá los datos para no memorizar la cuenta:
          resolvelo, comprobá el resultado y mirá la resolución paso a paso.
        </p>
        <div className="flex gap-4">
          <Link
            href="/magnetismo-teoria"
            className="text-xs text-blue-700 hover:underline dark:text-blue-400"
          >
            ← Teoría: tarjetas y quiz
          </Link>
          <Link
            href="/"
            className="text-xs text-blue-700 hover:underline dark:text-blue-400"
          >
            Volver al simulador
          </Link>
        </div>
      </header>

      <nav className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700">
        {GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => {
              setGroup(g.id);
              setId(EXERCISES.find((e) => e.group === g.id)?.id ?? "");
            }}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              group === g.id
                ? "border-blue-600 font-medium text-blue-700 dark:text-blue-400"
                : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {g.label}
          </button>
        ))}
      </nav>

      <div className="flex flex-wrap gap-1.5">
        {list.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setId(e.id)}
            className={`rounded-full border px-2.5 py-1 text-xs ${
              e.id === exercise?.id
                ? "border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            {e.title}
          </button>
        ))}
      </div>

      {exercise && <ExerciseView key={exercise.id} exercise={exercise} />}

      <ProjectCredits />
    </main>
  );
}
