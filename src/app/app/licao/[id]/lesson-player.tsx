"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X, Zap, Heart, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Mascot } from "@/components/mascot";
import { Confetti } from "@/components/confetti";
import {
  playCorrect,
  playWrong,
  playCheer,
  playFail,
  playCombo,
  playLifeLost,
  playTapCTA,
  playStreakTick,
  playStreakMilestone,
} from "@/lib/sounds";
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
  initialLives: number;
  initialStreakDays: number;
};

type Feedback = {
  isCorrect: boolean;
  correctKey: string;
  explanation: string;
  sourceCitation: string;
  xpAwarded: number;
};

export function LessonPlayer({
  lessonId,
  title,
  intro,
  outro,
  questions,
  initialLives,
  initialStreakDays,
}: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<"intro" | "question" | "complete">("intro");
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pending, startTransition] = useTransition();
  const [errorAttempts, setErrorAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [xpFromQuestions, setXpFromQuestions] = useState(0);
  const [bonusXp, setBonusXp] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [livesNow, setLivesNow] = useState(initialLives);
  const [heartBreakKey, setHeartBreakKey] = useState(0);
  const [finalStreakDays, setFinalStreakDays] = useState(initialStreakDays);

  const total = questions.length;
  const current = questions[idx];

  function handleStart() {
    playTapCTA();
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
        setCorrectCount((n) => n + 1);
        setXpFromQuestions((n) => n + res.xpAwarded);
        const nextCombo = comboStreak + 1;
        setComboStreak(nextCombo);
        // Combo a cada 5 acertos seguidos. playCombo substitui o playCorrect
        // pra não sobrepor sons.
        if (nextCombo > 0 && nextCombo % 5 === 0) {
          playCombo();
        } else {
          playCorrect();
        }
      } else {
        setErrorAttempts((n) => n + 1);
        setComboStreak(0);
        const nextLives = Math.max(0, livesNow - 1);
        setLivesNow(nextLives);
        setHeartBreakKey((k) => k + 1); // re-trigger animation
        // Vidas zeradas: drama. Senão, som de erro padrão.
        if (nextLives === 0 && livesNow > 0) {
          playLifeLost();
        } else {
          playWrong();
        }
      }
    });
  }

  function handleNext() {
    playTapCTA();
    setChosen(null);
    setFeedback(null);
    setStartedAt(Date.now());
    if (idx + 1 < total) {
      setIdx(idx + 1);
    } else {
      const allCorrect = errorAttempts === 0;
      startTransition(async () => {
        const res = await completeLesson({ lessonId, allCorrect });
        if ("ok" in res && res.ok) {
          setBonusXp(res.bonusXp ?? 0);
          setFinalStreakDays(res.streakDays ?? initialStreakDays);
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
            className="btn-3d [--btn-rim:#005a23] mt-auto flex h-14 items-center justify-center rounded-2xl bg-brand-green font-display text-lg font-semibold text-brand-green-fg"
          >
            Começar
          </button>
        </section>
      </main>
    );
  }

  // ---- Conclusão ----
  if (phase === "complete") {
    const livesLost = Math.max(0, initialLives - livesNow);
    const totalXp = xpFromQuestions + bonusXp;
    const allCorrect = errorAttempts === 0;

    return (
      <CompleteScreen
        allCorrect={allCorrect}
        totalXp={totalXp}
        errorAttempts={errorAttempts}
        correctCount={correctCount}
        total={total}
        livesLost={livesLost}
        initialLives={initialLives}
        bonusXp={bonusXp}
        outro={outro}
        initialStreakDays={initialStreakDays}
        finalStreakDays={finalStreakDays}
        onContinue={() => {
          router.push("/app");
          router.refresh();
        }}
      />
    );
  }

  // ---- Questão ativa ----
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-6">
      <PlayerHeader
        current={idx + 1}
        total={total}
        lives={livesNow}
        heartBreakKey={heartBreakKey}
      />

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
                  "btn-squash flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
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

function PlayerHeader({
  current,
  total,
  lives,
  heartBreakKey,
}: {
  current: number;
  total: number;
  lives: number;
  heartBreakKey: number;
}) {
  const pct = Math.round((current / total) * 100);
  const lostHeartCount = heartBreakKey; // each break increments this
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
      <div
        key={lostHeartCount}
        className={cn(
          "relative flex items-center gap-1 text-sm font-semibold tabular-nums",
          lostHeartCount > 0 && "animate-shake-x",
        )}
        aria-label={`${lives} vidas restantes`}
      >
        <Heart className="size-5 text-error" fill="currentColor" />
        <span>{lives}</span>
        {lostHeartCount > 0 && (
          <span
            key={`break-${lostHeartCount}`}
            className="pointer-events-none absolute -left-1 -top-2 animate-heart-break text-error"
            aria-hidden
          >
            <Heart className="size-5" fill="currentColor" />
          </span>
        )}
      </div>
    </div>
  );
}

function CompleteScreen({
  allCorrect,
  totalXp,
  errorAttempts,
  correctCount,
  total,
  livesLost,
  initialLives,
  bonusXp,
  outro,
  initialStreakDays,
  finalStreakDays,
  onContinue,
}: {
  allCorrect: boolean;
  totalXp: number;
  errorAttempts: number;
  correctCount: number;
  total: number;
  livesLost: number;
  initialLives: number;
  bonusXp: number;
  outro: string | null;
  initialStreakDays: number;
  finalStreakDays: number;
  onContinue: () => void;
}) {
  // Sucesso vs falha pra som de fim de lição:
  //   - Sucesso = ganhou XP (acertou pelo menos uma questão da lição)
  //   - Falha   = ficou sem vidas e/ou ganhou 0 XP
  const isFailure = totalXp === 0 || (livesLost >= initialLives && initialLives > 0);
  const streakIncremented = finalStreakDays > initialStreakDays;
  const isMilestone = streakIncremented && [7, 30, 100].includes(finalStreakDays);

  // Toca exatamente UMA vez no mount. useRef evita disparo duplo do
  // StrictMode em dev e qualquer re-execução por re-render.
  // Não faz cleanup pra parar o som — o stopAllAssets() de dentro do
  // playAsset já garante que cheer/fail nunca tocam simultaneamente.
  //
  // Ordem: cheer/fail primeiro. Se streak ticou, encadeia tick/milestone
  // depois de ~700ms pra não atropelar o cheer.
  const playedRef = useRef(false);
  useEffect(() => {
    if (playedRef.current) return;
    playedRef.current = true;
    if (isFailure) playFail();
    else playCheer();

    if (streakIncremented) {
      const t = setTimeout(() => {
        if (isMilestone) playStreakMilestone();
        else playStreakTick();
      }, 700);
      return () => clearTimeout(t);
    }
  }, [isFailure, streakIncremented, isMilestone]);

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
      {totalXp > 0 && <Confetti />}
      <section className="mt-10 flex flex-1 flex-col items-center text-center">
        <div className="animate-pop-in">
          <Mascot
            size={160}
            variant={
              allCorrect
                ? "happy"
                : livesLost >= initialLives && initialLives > 0
                  ? "sad"
                  : "idle"
            }
          />
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold">
          {allCorrect ? "Cravou tudo!" : "Lição feita."}
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          {allCorrect
            ? "Sem erros. Mandou bem demais."
            : `${errorAttempts} tropeço${errorAttempts > 1 ? "s" : ""} — bora de novo um dia desses.`}
        </p>

        <div className="mt-8 grid w-full grid-cols-3 gap-2">
          <StatCard
            label="Acertos"
            value={`${correctCount}/${total}`}
            tone="success"
            delay={0}
          />
          <StatCard
            label="XP ganho"
            value={`+${totalXp}`}
            tone="yellow"
            icon={<Zap className="size-4" />}
            delay={120}
          />
          <StatCard
            label="Vidas"
            value={
              <AnimatedHeartCount
                from={initialLives}
                to={initialLives - livesLost}
                startDelayMs={540}
              />
            }
            tone="error"
            icon={<Heart className="size-4" />}
            delay={240}
          />
        </div>

        {bonusXp > 0 && (
          <div className="mt-4 flex animate-pop-in items-center gap-2 rounded-full bg-brand-yellow/20 px-4 py-2 text-sm text-brand-yellow">
            <Zap className="size-4" />
            <span className="font-medium">+{bonusXp} bônus de fase</span>
          </div>
        )}

        {outro && <p className="mt-6 text-sm text-text-muted">{outro}</p>}

        <button
          type="button"
          onClick={onContinue}
          className="mt-auto flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand-green font-display text-lg font-semibold text-brand-green-fg shadow-sm btn-squash"
        >
          {totalXp > 0 ? (
            <>
              <Zap className="size-5" />
              Receber +{totalXp} XP
            </>
          ) : (
            "Continuar"
          )}
        </button>
      </section>
    </main>
  );
}

// Conta vidas decrementando de `from` até `to`, uma por vez. Se from===to,
// mostra estático. Cada decremento dispara um pulse rápido no número pra
// dar peso visual ao "perdeu uma vida".
function AnimatedHeartCount({
  from,
  to,
  startDelayMs = 0,
}: {
  from: number;
  to: number;
  startDelayMs?: number;
}) {
  const [value, setValue] = useState(from);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    if (from === to) {
      setValue(to);
      return;
    }
    setValue(from);
    const direction = to > from ? 1 : -1;
    const steps = Math.abs(to - from);
    const stepMs = 320;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= steps; i++) {
      const t = setTimeout(() => {
        setValue(from + i * direction);
        setPulseKey((k) => k + 1);
      }, startDelayMs + i * stepMs);
      timeouts.push(t);
    }
    return () => timeouts.forEach(clearTimeout);
  }, [from, to, startDelayMs]);

  return (
    <span key={pulseKey} className={pulseKey > 0 ? "inline-block animate-shake-x" : "inline-block"}>
      {value}
    </span>
  );
}

function StatCard({
  label,
  value,
  tone,
  icon,
  delay,
}: {
  label: string;
  value: React.ReactNode;
  tone: "success" | "yellow" | "error" | "muted";
  icon?: React.ReactNode;
  delay: number;
}) {
  return (
    <div
      className={cn(
        "flex animate-count-up flex-col items-center justify-center rounded-2xl border p-3",
        tone === "success" && "border-success/40 bg-success/10 text-success",
        tone === "yellow" && "border-brand-yellow/40 bg-brand-yellow/15 text-brand-yellow",
        tone === "error" && "border-error/40 bg-error/10 text-error",
        tone === "muted" && "border-border bg-surface text-text-muted",
      )}
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
    >
      <div className="flex items-center gap-1 font-display text-lg font-bold">
        {icon}
        {value}
      </div>
      <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide opacity-80">
        {label}
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
