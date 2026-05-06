"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X, Zap, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { playCorrect, playWrong } from "@/lib/sounds";
import { submitAttempt, completeLesson } from "./actions";

type ClientChoice = { key: string; text: string };
type ClientQuestion = {
  id: string;
  difficulty: number;
  stem: string;
  choices: ClientChoice[];
};

type Props = {
  lessonId: string;
  title: string;
  intro: string | null;
  outro: string | null;
  questions: ClientQuestion[];
};

type Feedback = {
  isCorrect: boolean;
  correctKey: string;
  explanation: string;
  sourceCitation: string;
  xpAwarded: number;
};

export function LessonPlayer({ lessonId, title, intro, outro, questions }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<"intro" | "question" | "complete">("intro");
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pending, startTransition] = useTransition();
  const [errorAttempts, setErrorAttempts] = useState(0);
  const [bonusXp, setBonusXp] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());

  const total = questions.length;
  const current = questions[idx];

  const totalXp = useMemo(() => {
    // visual only — fonte de verdade está no DB
    return 0; // calculamos localmente conforme submit responde
  }, []);

  function handleStart() {
    setPhase("question");
    setStartedAt(Date.now());
  }

  function handleChoose(key: string) {
    if (chosen || pending) return;
    setChosen(key);
    startTransition(async () => {
      const res = await submitAttempt({
        questionId: current.id,
        lessonId,
        chosenKey: key,
        timeMs: Math.min(Date.now() - startedAt, 600_000),
      });
      if ("error" in res) {
        setChosen(null);
        return;
      }
      setFeedback(res);
      if (res.isCorrect) {
        playCorrect();
      } else {
        playWrong();
        setErrorAttempts((n) => n + 1);
      }
    });
  }

  function handleNext() {
    setChosen(null);
    setFeedback(null);
    setStartedAt(Date.now());
    if (idx + 1 < total) {
      setIdx(idx + 1);
    } else {
      // fim da lição
      const allCorrect = errorAttempts === 0;
      startTransition(async () => {
        const res = await completeLesson({ lessonId, allCorrect });
        if ("ok" in res && res.ok) {
          setBonusXp(res.bonusXp ?? 0);
        }
        setPhase("complete");
      });
    }
  }

  // ---- Intro ----
  if (phase === "intro") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
        <Link href="/app" className="flex items-center gap-1 text-sm text-text-muted">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
        <section className="mt-12 flex flex-1 flex-col">
          <span className="text-xs font-medium text-brand-green">{total} questões</span>
          <h1 className="mt-1 font-display text-3xl font-bold leading-tight">{title}</h1>
          {intro && <p className="mt-3 text-text-muted">{intro}</p>}
          <button
            type="button"
            onClick={handleStart}
            className="mt-auto flex h-14 items-center justify-center rounded-2xl bg-brand-green font-display text-lg font-semibold text-brand-green-fg shadow-sm transition-transform active:scale-[0.98]"
          >
            Começar
          </button>
        </section>
      </main>
    );
  }

  // ---- Conclusão ----
  if (phase === "complete") {
    const allCorrect = errorAttempts === 0;
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
        <section className="mt-16 flex flex-1 flex-col items-center text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-brand-green/15">
            <Check className="size-10 text-brand-green" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold">Lição feita.</h1>
          <p className="mt-2 text-text-muted">
            {allCorrect ? "Sem erros. Mandou bem demais." : `${errorAttempts} erro(s). Da próxima vai.`}
          </p>

          {bonusXp > 0 && (
            <div className="mt-6 flex items-center gap-2 rounded-full bg-brand-yellow/20 px-4 py-2 text-brand-yellow">
              <Zap className="size-4" />
              <span className="font-medium">+{bonusXp} XP de bônus</span>
            </div>
          )}

          {outro && <p className="mt-8 text-sm text-text-muted">{outro}</p>}

          <button
            type="button"
            onClick={() => {
              router.push("/app");
              router.refresh();
            }}
            className="mt-auto flex h-14 w-full items-center justify-center rounded-2xl bg-brand-green font-display text-lg font-semibold text-brand-green-fg shadow-sm transition-transform active:scale-[0.98]"
          >
            Continuar
          </button>
        </section>
      </main>
    );
  }

  // ---- Questão ativa ----
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-6">
      <ProgressBar current={idx + 1} total={total} />

      <section className="mt-8 flex flex-1 flex-col">
        <span className="text-xs font-medium text-text-muted">
          Questão {idx + 1} de {total} · dificuldade {current.difficulty}
        </span>
        <h2 className="mt-2 font-display text-xl leading-snug font-semibold">{current.stem}</h2>

        <div className="mt-6 flex flex-col gap-3">
          {current.choices.map((c) => {
            const isChosen = chosen === c.key;
            const isCorrectAnswer = feedback && c.key === feedback.correctKey;
            const isWrongChosen = feedback && isChosen && !feedback.isCorrect;

            return (
              <button
                key={c.key}
                type="button"
                disabled={!!chosen}
                onClick={() => handleChoose(c.key)}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
                  !chosen && "border-border bg-surface hover:border-text-muted",
                  chosen && !feedback && isChosen && "border-brand-green bg-brand-green/10",
                  feedback && isCorrectAnswer && "border-success bg-success/10",
                  feedback && isWrongChosen && "border-error bg-error/10",
                  feedback && !isCorrectAnswer && !isWrongChosen && "border-border bg-surface opacity-60",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border font-display text-sm font-bold",
                    !chosen && "border-border",
                    chosen && !feedback && isChosen && "border-brand-green bg-brand-green text-brand-green-fg",
                    feedback && isCorrectAnswer && "border-success bg-success text-white",
                    feedback && isWrongChosen && "border-error bg-error text-white",
                  )}
                >
                  {feedback && isCorrectAnswer ? <Check className="size-4" /> :
                   feedback && isWrongChosen ? <X className="size-4" /> : c.key}
                </span>
                <span className="flex-1 pt-0.5">{c.text}</span>
              </button>
            );
          })}
        </div>
      </section>

      {feedback && (
        <ExplanationDrawer feedback={feedback} onNext={handleNext} pending={pending} />
      )}
    </main>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <Link href="/app" className="text-text-muted">
        <ArrowLeft className="size-5" />
      </Link>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
        <div
          className="h-full bg-brand-green transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ExplanationDrawer({
  feedback,
  onNext,
  pending,
}: {
  feedback: Feedback;
  onNext: () => void;
  pending: boolean;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 -mx-6 mt-6 rounded-t-3xl border-t-2 px-6 pt-5 pb-8 shadow-[0_-12px_30px_rgba(0,0,0,0.18)]",
        feedback.isCorrect
          ? "border-success bg-[#f0fdf4] dark:bg-[#06281a]"
          : "border-error bg-[#fef2f2] dark:bg-[#2a0c0c]",
      )}
    >
      <div className="flex items-center gap-2">
        {feedback.isCorrect ? (
          <>
            <Check className="size-5 text-success" />
            <span className="font-display font-bold text-success">Mandou bem!</span>
            <span className="ml-auto flex items-center gap-1 text-sm text-success">
              <Zap className="size-4" /> +{feedback.xpAwarded} XP
            </span>
          </>
        ) : (
          <>
            <X className="size-5 text-error" />
            <span className="font-display font-bold text-error">Quase.</span>
            <span className="ml-auto text-sm text-error">A correta era {feedback.correctKey}</span>
          </>
        )}
      </div>
      <p className="mt-3 text-sm leading-relaxed">{feedback.explanation}</p>
      <p className="mt-2 text-xs text-text-muted italic">{feedback.sourceCitation}</p>
      <button
        type="button"
        onClick={onNext}
        disabled={pending}
        className={cn(
          "mt-4 flex h-12 w-full items-center justify-center rounded-2xl font-display font-semibold shadow-sm",
          feedback.isCorrect ? "bg-success text-white" : "bg-error text-white",
          "disabled:opacity-60",
        )}
      >
        {pending ? "..." : "Próxima"}
      </button>
    </div>
  );
}
