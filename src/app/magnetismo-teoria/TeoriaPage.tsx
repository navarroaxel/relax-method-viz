"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { GitHubLink } from "@/components/GitHubLink";
import { ProjectCredits } from "@/components/ProjectCredits";
import {
  countMastered,
  type Grade,
  MAX_BOX,
  nextBox,
  pickNextCard,
  shuffleSeeded,
} from "@/lib/teoriaStudy";

import {
  CARDS,
  ORDER_EXERCISES,
  QUIZ,
  PAIR_SETS,
  type OrderExercise,
  type PairSet,
} from "./content";
import {
  getBoxes,
  getServerBoxes,
  saveBoxes,
  subscribeBoxes,
  type Boxes,
} from "./progressStore";
import { Rich, Tex } from "./Tex";

const CARD =
  "rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900";
const BTN =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800";
const BTN_PRIMARY =
  "rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40";
const BODY = "text-sm leading-relaxed text-zinc-600 dark:text-zinc-300";

type Mode = "cards" | "quiz" | "order" | "match";

const MODES: { id: Mode; label: string; help: string }[] = [
  {
    id: "cards",
    label: "Tarjetas",
    help: "Leé la pregunta, recordá cada paso en tu cabeza y recién después revelalo. Marcá qué tan bien lo sabías: las que fallás vuelven más seguido.",
  },
  {
    id: "quiz",
    label: "Quiz",
    help: "Opción múltiple con distractores parecidos (signos, constantes, condiciones). Cada ronda son 10 preguntas, empezando por los temas que peor tenés. Si fallás, ese tema baja de nivel en las tarjetas.",
  },
  {
    id: "order",
    label: "Ordenar deducciones",
    help: "Tocá los pasos en el orden correcto de la deducción. Un error no te frena, pero cuenta.",
  },
  {
    id: "match",
    label: "Emparejar",
    help: "Unite cada ecuación con su significado. Tocá una de la izquierda y una de la derecha.",
  },
];

const BOX_STYLE = [
  "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  "bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-300",
  "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
];

function BoxBadge({ box }: { box: number }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${BOX_STYLE[box] ?? BOX_STYLE[0]}`}
    >
      {box >= MAX_BOX ? "dominada" : `nivel ${box}`}
    </span>
  );
}

function Flashcards({ boxes }: { boxes: Boxes }) {
  const ids = useMemo(() => CARDS.map((c) => c.id), []);
  const [currentId, setCurrentId] = useState(ids[0] ?? "");
  const [revealed, setRevealed] = useState(0);
  const card = CARDS.find((c) => c.id === currentId) ?? CARDS[0];

  const jump = useCallback((id: string) => {
    setCurrentId(id);
    setRevealed(0);
  }, []);

  const grade = useCallback(
    (g: Grade) => {
      if (!card) return;
      const next = { ...boxes, [card.id]: nextBox(boxes[card.id] ?? 0, g) };
      saveBoxes(next);
      jump(pickNextCard(ids, next, card.id, Math.random) ?? card.id);
    },
    [boxes, card, ids, jump],
  );

  const total = card?.steps.length ?? 0;
  const done = revealed >= total;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if (
        t instanceof HTMLElement &&
        /^(INPUT|TEXTAREA|BUTTON|A)$/.test(t.tagName)
      )
        return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!done) setRevealed((n) => n + 1);
      } else if (done && e.key === "1") grade("forgot");
      else if (done && e.key === "2") grade("doubt");
      else if (done && e.key === "3") grade("know");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, grade]);

  if (!card) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {CARDS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => jump(c.id)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
              c.id === card.id
                ? "border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            {c.title}
            <BoxBadge box={boxes[c.id] ?? 0} />
          </button>
        ))}
      </div>

      <section className={`${CARD} flex flex-col gap-3`}>
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {card.question}
          </h2>
          <BoxBadge box={boxes[card.id] ?? 0} />
        </div>

        <ol className="flex flex-col gap-2">
          {card.steps.map((s, i) => {
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
                    ¿Lo recordás? Revelar
                  </button>
                ) : null}
              </li>
            );
          })}
        </ol>

        {done ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-300">
              ¿Qué tan bien lo sabías?
            </span>
            <button
              type="button"
              className={BTN}
              onClick={() => grade("forgot")}
            >
              No lo sabía <kbd className="text-xs opacity-60">1</kbd>
            </button>
            <button
              type="button"
              className={BTN}
              onClick={() => grade("doubt")}
            >
              Dudé <kbd className="text-xs opacity-60">2</kbd>
            </button>
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={() => grade("know")}
            >
              Lo sabía <kbd className="text-xs opacity-80">3</kbd>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={() => setRevealed((n) => n + 1)}
            >
              Revelar siguiente{" "}
              <kbd className="text-xs opacity-80">espacio</kbd>
            </button>
            <button
              type="button"
              className={BTN}
              onClick={() => setRevealed(total)}
            >
              Revelar todo
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function OrderGame({ exercise }: { exercise: OrderExercise }) {
  const [seed, setSeed] = useState(1);
  const [placed, setPlaced] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);

  const order = useMemo(
    () =>
      shuffleSeeded(
        exercise.items.map((_, i) => i),
        seed * 7919 + exercise.items.length,
      ),
    [exercise, seed],
  );
  const finished = placed >= exercise.items.length;

  const pick = (i: number) => {
    if (i === placed) {
      setPlaced(placed + 1);
      setWrong(null);
    } else {
      setMistakes((m) => m + 1);
      setWrong(i);
    }
  };
  const restart = () => {
    setSeed((s) => s + 1);
    setPlaced(0);
    setMistakes(0);
    setWrong(null);
  };

  return (
    <section className={`${CARD} flex flex-col gap-3`}>
      <ol className="flex flex-col gap-2">
        {exercise.items.slice(0, placed).map((it, i) => (
          <li
            key={i}
            className="rounded-md border border-green-300 bg-green-50 p-2 dark:border-green-800 dark:bg-green-950/40"
          >
            <div className="text-xs font-medium text-green-800 dark:text-green-300">
              Paso {i + 1}
            </div>
            <Tex tex={it.tex} block />
            <p className={BODY}>
              <Rich text={it.why} />
            </p>
          </li>
        ))}
      </ol>

      {finished ? (
        <p className="text-sm font-medium text-green-700 dark:text-green-400">
          {mistakes === 0
            ? "¡Deducción perfecta, sin errores!"
            : `Completa. Errores: ${mistakes}. Probá de nuevo para dejarlo en cero.`}
        </p>
      ) : (
        <>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            ¿Cuál es el paso {placed + 1}? · Errores: {mistakes}
          </p>
          <div className="flex flex-col gap-2">
            {order
              .filter((i) => i >= placed)
              .map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(i)}
                  className={`rounded-md border p-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                    wrong === i
                      ? "border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/40"
                      : "border-zinc-300 dark:border-zinc-600"
                  }`}
                >
                  <Tex tex={exercise.items[i]?.tex ?? ""} block />
                </button>
              ))}
          </div>
        </>
      )}
      <div>
        <button type="button" className={BTN} onClick={restart}>
          Reordenar y reiniciar
        </button>
      </div>
    </section>
  );
}

function MatchGame({ set }: { set: PairSet }) {
  const [seed, setSeed] = useState(1);
  const [matched, setMatched] = useState<ReadonlySet<number>>(new Set());
  const [sel, setSel] = useState<{ side: "t" | "m"; i: number } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [flash, setFlash] = useState<{ side: "t" | "m"; i: number } | null>(
    null,
  );

  const idx = useMemo(() => set.pairs.map((_, i) => i), [set]);
  const terms = useMemo(() => shuffleSeeded(idx, seed * 31 + 1), [idx, seed]);
  const meanings = useMemo(
    () => shuffleSeeded(idx, seed * 17 + 5),
    [idx, seed],
  );
  const finished = matched.size === set.pairs.length;

  const click = (side: "t" | "m", i: number) => {
    if (matched.has(i)) return;
    setFlash(null);
    if (!sel || sel.side === side) {
      setSel({ side, i });
      return;
    }
    if (sel.i === i) {
      setMatched(new Set(matched).add(i));
      setSel(null);
    } else {
      setMistakes((m) => m + 1);
      setFlash({ side, i });
      setSel(null);
    }
  };
  const restart = () => {
    setSeed((s) => s + 1);
    setMatched(new Set());
    setSel(null);
    setFlash(null);
    setMistakes(0);
  };

  const cls = (side: "t" | "m", i: number) => {
    if (matched.has(i))
      return "border-green-300 bg-green-50 opacity-60 dark:border-green-800 dark:bg-green-950/40";
    if (sel?.side === side && sel.i === i)
      return "border-blue-500 bg-blue-50 dark:bg-blue-950";
    if (flash?.side === side && flash.i === i)
      return "border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/40";
    return "border-zinc-300 hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800";
  };

  return (
    <section className={`${CARD} flex flex-col gap-3`}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          {terms.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => click("t", i)}
              className={`flex min-h-12 items-center justify-center rounded-md border p-2 ${cls("t", i)}`}
            >
              <Tex tex={set.pairs[i]?.term ?? ""} />
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {meanings.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => click("m", i)}
              className={`flex min-h-12 items-center rounded-md border p-2 text-left text-sm text-zinc-700 dark:text-zinc-200 ${cls("m", i)}`}
            >
              {set.pairs[i]?.meaning}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {finished
          ? mistakes === 0
            ? "¡Todas bien, sin errores!"
            : `Completo. Errores: ${mistakes}.`
          : `${matched.size}/${set.pairs.length} unidas · Errores: ${mistakes}`}
      </p>
      <div>
        <button type="button" className={BTN} onClick={restart}>
          Mezclar y reiniciar
        </button>
      </div>
    </section>
  );
}

const QUIZ_LENGTH = 10;

function Quiz({ boxes }: { boxes: Boxes }) {
  const [seed, setSeed] = useState(1);
  // Los niveles al empezar la ronda: fallar no reordena las preguntas restantes.
  const [startBoxes, setStartBoxes] = useState(boxes);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [failed, setFailed] = useState<readonly string[]>([]);

  const questions = useMemo(
    () =>
      shuffleSeeded(QUIZ, seed * 104729)
        .map((q, i) => ({ q, i }))
        .sort(
          (a, b) =>
            (startBoxes[a.q.cardId] ?? 0) - (startBoxes[b.q.cardId] ?? 0) ||
            a.i - b.i,
        )
        .slice(0, QUIZ_LENGTH)
        .map(({ q }) => q),
    [seed, startBoxes],
  );
  const question = questions[index];
  const options = useMemo(
    () =>
      question
        ? shuffleSeeded(
            question.options.map((_, i) => i),
            seed * 31 + index * 7 + 3,
          )
        : [],
    [question, seed, index],
  );
  const finished = index >= questions.length;
  const answered = picked !== null;

  const answer = useCallback(
    (i: number) => {
      if (!question || picked !== null) return;
      setPicked(i);
      if (i === 0) {
        setScore((s) => s + 1);
      } else {
        setFailed((f) =>
          f.includes(question.cardId) ? f : [...f, question.cardId],
        );
        saveBoxes({
          ...boxes,
          [question.cardId]: nextBox(boxes[question.cardId] ?? 0, "forgot"),
        });
      }
    },
    [boxes, picked, question],
  );
  const next = useCallback(() => {
    setIndex((n) => n + 1);
    setPicked(null);
  }, []);
  const restart = () => {
    setSeed((s) => s + 1);
    setStartBoxes(boxes);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setFailed([]);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished) return;
      if (answered && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        next();
      } else if (!answered && /^[1-4]$/.test(e.key)) {
        const o = options[Number(e.key) - 1];
        if (o !== undefined) answer(o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answered, finished, options, answer, next]);

  if (finished) {
    return (
      <section className={`${CARD} flex flex-col gap-3`}>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {score}/{questions.length} correctas
        </h2>
        {failed.length > 0 ? (
          <div className={BODY}>
            A repasar:{" "}
            {failed
              .map((id) => CARDS.find((c) => c.id === id)?.title ?? id)
              .join(" · ")}
            . Ya bajaron de nivel en las tarjetas.
          </div>
        ) : (
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            ¡Ronda perfecta!
          </p>
        )}
        <div>
          <button type="button" className={BTN_PRIMARY} onClick={restart}>
            Nueva ronda
          </button>
        </div>
      </section>
    );
  }
  if (!question) return null;

  return (
    <section className={`${CARD} flex flex-col gap-3`}>
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>
          Pregunta {index + 1}/{questions.length}
        </span>
        <span>Aciertos: {score}</span>
      </div>
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        <Rich text={question.prompt} />
      </h2>
      <div className="flex flex-col gap-2">
        {options.map((o, pos) => {
          const opt = question.options[o];
          const isRight = o === 0;
          const style = !answered
            ? "border-zinc-300 hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
            : isRight
              ? "border-green-400 bg-green-50 dark:border-green-700 dark:bg-green-950/40"
              : o === picked
                ? "border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/40"
                : "border-zinc-200 opacity-60 dark:border-zinc-700";
          return (
            <button
              key={o}
              type="button"
              disabled={answered}
              onClick={() => answer(o)}
              className={`flex items-center gap-3 rounded-md border p-2 text-left ${style}`}
            >
              <kbd className="text-xs text-zinc-400">{pos + 1}</kbd>
              <span className="min-w-0 flex-1 text-sm text-zinc-700 dark:text-zinc-200">
                {opt?.tex ? (
                  <Tex tex={opt.tex} />
                ) : (
                  <Rich text={opt?.text ?? ""} />
                )}
              </span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="flex flex-col gap-2">
          <p className={BODY}>
            <strong>{picked === 0 ? "¡Correcto! " : "No era esa. "}</strong>
            <Rich text={question.explain} />
          </p>
          <div>
            <button type="button" className={BTN_PRIMARY} onClick={next}>
              {index + 1 >= questions.length ? "Ver resultado" : "Siguiente"}{" "}
              <kbd className="text-xs opacity-80">enter</kbd>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Picker<T extends { id: string; title: string }>({
  items,
  value,
  onChange,
}: {
  items: T[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onChange(it.id)}
          className={`rounded-full border px-2.5 py-1 text-xs ${
            it.id === value
              ? "border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
              : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
        >
          {it.title}
        </button>
      ))}
    </div>
  );
}

export function TeoriaPage() {
  const boxes = useSyncExternalStore(subscribeBoxes, getBoxes, getServerBoxes);
  const [mode, setMode] = useState<Mode>("cards");
  const [orderId, setOrderId] = useState(ORDER_EXERCISES[0]?.id ?? "");
  const [pairId, setPairId] = useState(PAIR_SETS[0]?.id ?? "");

  const ids = useMemo(() => CARDS.map((c) => c.id), []);
  const mastered = countMastered(ids, boxes);
  const current = MODES.find((m) => m.id === mode);
  const exercise =
    ORDER_EXERCISES.find((e) => e.id === orderId) ?? ORDER_EXERCISES[0];
  const pairSet = PAIR_SETS.find((p) => p.id === pairId) ?? PAIR_SETS[0];

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-3 p-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Teoría — repaso para el parcial
          </h1>
          <GitHubLink />
        </div>
        <p className={BODY}>
          Estudio activo de los postulados, teoremas y deducciones de la cátedra
          Teoría de los Campos (TdC 2P). Tu progreso se guarda en este
          navegador.
        </p>
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${(mastered / CARDS.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {mastered}/{CARDS.length} dominadas
          </span>
          {Object.keys(boxes).length > 0 && (
            <button
              type="button"
              className="text-xs text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400"
              onClick={() => saveBoxes({})}
            >
              reiniciar progreso
            </button>
          )}
        </div>
        <div className="flex gap-4">
          <Link
            href="/magnetismo-ejercicios"
            className="text-xs text-blue-700 hover:underline dark:text-blue-400"
          >
            Ejercicios de parciales y guía →
          </Link>
          <Link
            href="/"
            className="text-xs text-blue-700 hover:underline dark:text-blue-400"
          >
            ← Volver al simulador
          </Link>
        </div>
      </header>

      <nav className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              mode === m.id
                ? "border-blue-600 font-medium text-blue-700 dark:text-blue-400"
                : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {m.label}
          </button>
        ))}
      </nav>
      <p className={BODY}>{current?.help}</p>

      {mode === "cards" && <Flashcards boxes={boxes} />}
      {mode === "order" && exercise && (
        <>
          <Picker
            items={ORDER_EXERCISES}
            value={exercise.id}
            onChange={setOrderId}
          />
          <OrderGame key={exercise.id} exercise={exercise} />
        </>
      )}
      {mode === "quiz" && <Quiz boxes={boxes} />}
      {mode === "match" && pairSet && (
        <>
          <Picker items={PAIR_SETS} value={pairSet.id} onChange={setPairId} />
          <MatchGame key={pairSet.id} set={pairSet} />
        </>
      )}

      <ProjectCredits />
    </main>
  );
}
