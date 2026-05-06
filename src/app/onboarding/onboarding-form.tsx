"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { completeOnboarding } from "./actions";

type Track = {
  id: string;
  slug: string;
  name: string;
  issuer: string;
  exam_format: { questions?: number; duration_min?: number; status_note?: string } | null;
};

type Step = 1 | 2 | 3;

const DAILY_GOALS = [
  { minutes: 5, label: "Devagar e sempre", description: "5 min/dia" },
  { minutes: 10, label: "Ritmo certo", description: "10 min/dia" },
  { minutes: 20, label: "Bora pra cima", description: "20 min/dia" },
  { minutes: 30, label: "Modo guerra", description: "30 min/dia" },
];

export function OnboardingForm({ tracks }: { tracks: Track[] }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [trackId, setTrackId] = useState<string | null>(null);
  const [dailyGoalMin, setDailyGoalMin] = useState<number | null>(null);
  const [examDate, setExamDate] = useState<string>("");
  const [pending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleSubmit() {
    if (!trackId || !dailyGoalMin) return;
    setErrorMsg(null);
    startTransition(async () => {
      const result = await completeOnboarding({
        trackId,
        dailyGoalMin,
        examDate: examDate || null,
      });
      if (result?.error) {
        setErrorMsg(result.error);
        return;
      }
      router.push("/app");
      router.refresh();
    });
  }

  return (
    <div className="mt-8 flex flex-1 flex-col">
      <Stepper current={step} />

      {step === 1 && (
        <section className="mt-8 flex flex-1 flex-col">
          <h1 className="font-display text-2xl font-bold">Pra qual prova tu vai?</h1>
          <p className="mt-1 text-sm text-text-muted">Tu pode trocar depois.</p>

          <div className="mt-6 flex flex-col gap-3">
            {tracks.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTrackId(t.id)}
                className={cn(
                  "flex items-center justify-between rounded-2xl border p-4 text-left transition-colors",
                  trackId === t.id
                    ? "border-brand-green bg-brand-green/10"
                    : "border-border bg-surface hover:border-text-muted",
                )}
              >
                <div>
                  <div className="font-display font-semibold">{t.name}</div>
                  <div className="text-xs text-text-muted">{t.issuer}</div>
                  {t.exam_format?.status_note && (
                    <div className="mt-1 text-xs text-streak">{t.exam_format.status_note}</div>
                  )}
                </div>
                {trackId === t.id && <Check className="size-5 text-brand-green" />}
              </button>
            ))}
          </div>

          <NextButton disabled={!trackId} onClick={() => setStep(2)} />
        </section>
      )}

      {step === 2 && (
        <section className="mt-8 flex flex-1 flex-col">
          <h1 className="font-display text-2xl font-bold">Quanto tu consegue por dia?</h1>
          <p className="mt-1 text-sm text-text-muted">A gente te lembra na hora certa.</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {DAILY_GOALS.map((g) => (
              <button
                key={g.minutes}
                type="button"
                onClick={() => setDailyGoalMin(g.minutes)}
                className={cn(
                  "flex flex-col items-start rounded-2xl border p-4 text-left transition-colors",
                  dailyGoalMin === g.minutes
                    ? "border-brand-green bg-brand-green/10"
                    : "border-border bg-surface hover:border-text-muted",
                )}
              >
                <span className="font-display font-semibold">{g.label}</span>
                <span className="mt-1 text-xs text-text-muted">{g.description}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <BackButton onClick={() => setStep(1)} />
            <NextButton disabled={!dailyGoalMin} onClick={() => setStep(3)} className="flex-1" />
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mt-8 flex flex-1 flex-col">
          <h1 className="font-display text-2xl font-bold">Quando é a prova?</h1>
          <p className="mt-1 text-sm text-text-muted">
            Pula se ainda não sabe. A gente avisa quando faltarem 30 dias.
          </p>

          <label className="mt-6 flex flex-col gap-2">
            <span className="text-sm font-medium">Data da prova (opcional)</span>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="h-12 rounded-xl border border-input bg-surface-elevated px-4 outline-none transition-colors focus:border-brand-green focus:ring-2 focus:ring-brand-green/30"
            />
          </label>

          <div className="mt-auto flex gap-3 pt-8">
            <BackButton onClick={() => setStep(2)} />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={pending}
              className={cn(
                "flex h-14 flex-1 items-center justify-center rounded-2xl font-display text-lg font-semibold shadow-sm transition-transform active:scale-[0.98]",
                "bg-brand-green text-brand-green-fg disabled:opacity-60",
              )}
            >
              {pending ? "Salvando..." : "Bora estudar"}
            </button>
          </div>

          {errorMsg && <p className="mt-3 text-sm text-error">{errorMsg}</p>}
        </section>
      )}
    </div>
  );
}

function Stepper({ current }: { current: Step }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            n <= current ? "bg-brand-green" : "bg-border",
          )}
        />
      ))}
    </div>
  );
}

function NextButton({
  disabled,
  onClick,
  className,
}: {
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "mt-auto flex h-14 items-center justify-center rounded-2xl font-display text-lg font-semibold shadow-sm transition-transform active:scale-[0.98]",
        "bg-brand-green text-brand-green-fg disabled:opacity-40",
        className,
      )}
    >
      Continuar
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-14 items-center justify-center rounded-2xl border border-border bg-surface px-6 font-medium text-text"
    >
      Voltar
    </button>
  );
}
