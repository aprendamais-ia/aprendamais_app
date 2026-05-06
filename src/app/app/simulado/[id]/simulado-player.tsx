"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitSimuladoAttempt, finishSimulado } from "../actions";

type ClientChoice = { key: string; text: string };
type ClientQuestion = { id: string; stem: string; choices: ClientChoice[] };

type Props = {
  simuladoId: string;
  startedAt: string;
  durationMin: number;
  questions: ClientQuestion[];
};

export function SimuladoPlayer({ simuladoId, startedAt, durationMin, questions }: Props) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [now, setNow] = useState(() => Date.now());
  const [pending, startTransition] = useTransition();
  const [finishing, setFinishing] = useState(false);
  const [questionStartedAt, setQuestionStartedAt] = useState(() => Date.now());

  const startMs = new Date(startedAt).getTime();
  const endMs = startMs + durationMin * 60_000;
  const remainingMs = Math.max(0, endMs - now);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (remainingMs === 0 && !finishing) {
      handleFinish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs]);

  function formatRemaining(ms: number) {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${m}:${String(s).padStart(2, "0")}`;
  }

  const current = questions[idx];

  function handleChoose(key: string) {
    if (pending || finishing) return;
    setAnswers((curr) => ({ ...curr, [current.id]: key }));
    startTransition(async () => {
      await submitSimuladoAttempt({
        simuladoId,
        questionId: current.id,
        chosenKey: key,
        timeMs: Math.min(Date.now() - questionStartedAt, 3_600_000),
      });
    });
  }

  function goTo(newIdx: number) {
    if (newIdx < 0 || newIdx >= questions.length) return;
    setIdx(newIdx);
    setQuestionStartedAt(Date.now());
  }

  async function handleFinish() {
    if (finishing) return;
    setFinishing(true);
    const res = await finishSimulado({ simuladoId });
    if ("ok" in res && res.ok) {
      router.push(`/app/simulado/${simuladoId}/resultado`);
    } else {
      setFinishing(false);
    }
  }

  const answered = Object.keys(answers).length;
  const lowTime = remainingMs < 5 * 60_000;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-muted">
            {idx + 1} / {questions.length}
          </span>
          <span className="text-xs text-text-muted">·</span>
          <span className="text-xs text-text-muted">{answered} respondidas</span>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 rounded-full px-3 py-1 font-mono text-sm font-semibold",
            lowTime ? "bg-error/15 text-error" : "bg-surface text-text",
          )}
        >
          <Clock className="size-4" />
          {formatRemaining(remainingMs)}
        </div>
      </header>

      <section className="mt-6 flex flex-1 flex-col">
        <h2 className="font-display text-lg leading-snug font-semibold">{current.stem}</h2>

        <div className="mt-5 flex flex-col gap-2.5">
          {current.choices.map((c) => {
            const isChosen = answers[current.id] === c.key;
            return (
              <button
                key={c.key}
                type="button"
                disabled={pending || finishing}
                onClick={() => handleChoose(c.key)}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors",
                  isChosen
                    ? "border-brand-green bg-brand-green/10"
                    : "border-border bg-surface hover:border-text-muted",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border font-display text-sm font-bold",
                    isChosen
                      ? "border-brand-green bg-brand-green text-brand-green-fg"
                      : "border-border",
                  )}
                >
                  {c.key}
                </span>
                <span className="flex-1 pt-0.5 text-sm">{c.text}</span>
              </button>
            );
          })}
        </div>
      </section>

      <nav className="mt-6 flex items-center gap-2">
        <button
          type="button"
          onClick={() => goTo(idx - 1)}
          disabled={idx === 0}
          className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-border bg-surface text-sm font-medium disabled:opacity-40"
        >
          Anterior
        </button>
        {idx < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => goTo(idx + 1)}
            className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-brand-green text-sm font-medium text-brand-green-fg"
          >
            Próxima
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            disabled={finishing}
            className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-brand-green text-sm font-medium text-brand-green-fg disabled:opacity-60"
          >
            <Flag className="size-4" />
            {finishing ? "Finalizando..." : "Finalizar"}
          </button>
        )}
      </nav>
    </main>
  );
}
