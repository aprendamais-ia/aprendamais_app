"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { xpForCorrect, LESSON_COMPLETE_BONUS } from "@/modules/learning/scoring";

const SubmitSchema = z.object({
  questionId: z.string().uuid(),
  lessonId: z.string().uuid(),
  chosenKey: z.string().min(1).max(3),
  timeMs: z.number().int().min(0).max(600_000).optional(),
});

const CompleteSchema = z.object({
  lessonId: z.string().uuid(),
  allCorrect: z.boolean(),
});

type Choice = { key: string; text: string; correct: boolean };

export async function submitAttempt(input: z.infer<typeof SubmitSchema>) {
  const parsed = SubmitSchema.safeParse(input);
  if (!parsed.success) return { error: "input_invalido" } as const;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "sem_sessao" } as const;

  // Fetch question (RLS exige published; safe)
  const { data: question, error: qErr } = await supabase
    .from("questions")
    .select("id, difficulty, choices, explanation, source_citation")
    .eq("id", parsed.data.questionId)
    .single();
  if (qErr || !question) return { error: "questao_nao_encontrada" } as const;

  const choices = question.choices as Choice[];
  const correct = choices.find((c) => c.correct);
  if (!correct) return { error: "questao_invalida" } as const;

  const isCorrect = parsed.data.chosenKey === correct.key;
  const xpAwarded = isCorrect ? xpForCorrect(question.difficulty) : 0;

  const { error: insertErr } = await supabase.from("attempts").insert({
    user_id: user.id,
    question_id: question.id,
    lesson_id: parsed.data.lessonId,
    chosen_key: parsed.data.chosenKey,
    is_correct: isCorrect,
    time_ms: parsed.data.timeMs ?? null,
    xp_awarded: xpAwarded,
    mode: "lesson" as const,
  });
  if (insertErr) return { error: "falha_persistir" } as const;

  return {
    ok: true as const,
    isCorrect,
    correctKey: correct.key,
    explanation: question.explanation,
    sourceCitation: question.source_citation,
    xpAwarded,
  };
}

export async function completeLesson(input: z.infer<typeof CompleteSchema>) {
  const parsed = CompleteSchema.safeParse(input);
  if (!parsed.success) return { error: "input_invalido" } as const;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "sem_sessao" } as const;

  let bonusXp = 0;

  if (parsed.data.allCorrect) {
    // Bônus de "lição completa sem erros": registra direto no profile.
    const { data: lesson } = await supabase
      .from("lessons").select("question_ids").eq("id", parsed.data.lessonId).single();
    const anchorQuestionId = lesson?.question_ids?.[0];
    if (anchorQuestionId) {
      const { data: profileXp } = await supabase
        .from("profiles").select("xp_total").eq("id", user.id).single();
      await supabase.from("profiles").update({
        xp_total: (profileXp?.xp_total ?? 0) + LESSON_COMPLETE_BONUS,
      }).eq("id", user.id);
      bonusXp = LESSON_COMPLETE_BONUS;
    }
  }

  // Sempre lê streak_days no fim — o trigger handle_attempt_insert pode ter
  // bumpado durante a lição (primeiro attempt do dia). Cliente compara contra
  // initialStreakDays pra decidir se toca playStreakTick/Milestone.
  const { data: profile } = await supabase
    .from("profiles").select("streak_days").eq("id", user.id).single();

  revalidatePath("/app");
  return {
    ok: true as const,
    bonusXp,
    streakDays: profile?.streak_days ?? 0,
  };
}
