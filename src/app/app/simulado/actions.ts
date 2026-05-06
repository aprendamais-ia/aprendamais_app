"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function createSimulado() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "sem_sessao" } as const;

  const { data: profile } = await supabase
    .from("profiles")
    .select("primary_track_id")
    .eq("id", user.id)
    .single();
  if (!profile?.primary_track_id) return { error: "sem_trilha" } as const;

  const { data: track } = await supabase
    .from("tracks")
    .select("id, exam_format")
    .eq("id", profile.primary_track_id)
    .single();
  if (!track) return { error: "trilha_invalida" } as const;

  const targetCount = (track.exam_format as { questions?: number } | null)?.questions ?? 50;

  // Busca questões publicadas da trilha. Pega do banco respeitando hierarquia
  // de topics (módulo raiz tem track_id; subtopics herdam via parent_id).
  const { data: topics } = await supabase
    .from("topics")
    .select("id")
    .eq("track_id", track.id);
  const topicIds = (topics ?? []).map((t) => t.id);
  if (topicIds.length === 0) return { error: "sem_topicos" } as const;

  // Postgres ORDER BY random() é OK para MVP (slow em N grande). Depois trocar
  // por sample reservoir ou pre-computed buckets.
  const { data: questions } = await supabase
    .from("questions")
    .select("id")
    .in("topic_id", topicIds)
    .eq("status", "published")
    .limit(targetCount * 3); // fetch 3x e shuffle local

  if (!questions || questions.length === 0) {
    return { error: "sem_questoes" } as const;
  }

  // Shuffle no app pra não depender de random() do PG
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  const selectedIds = shuffled.slice(0, targetCount).map((q) => q.id);

  const { data: simulado, error: insErr } = await supabase
    .from("simulados")
    .insert({
      user_id: user.id,
      track_id: track.id,
      question_ids: selectedIds,
    })
    .select("id")
    .single();
  if (insErr || !simulado) return { error: "falha_criar" } as const;

  return { ok: true as const, simuladoId: simulado.id, count: selectedIds.length };
}

const SubmitSchema = z.object({
  simuladoId: z.string().uuid(),
  questionId: z.string().uuid(),
  chosenKey: z.string().min(1).max(3),
  timeMs: z.number().int().min(0).max(3_600_000).optional(),
});

export async function submitSimuladoAttempt(input: z.infer<typeof SubmitSchema>) {
  const parsed = SubmitSchema.safeParse(input);
  if (!parsed.success) return { error: "input_invalido" } as const;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "sem_sessao" } as const;

  const { data: question } = await supabase
    .from("questions")
    .select("id, choices")
    .eq("id", parsed.data.questionId)
    .single();
  if (!question) return { error: "questao_nao_encontrada" } as const;

  const choices = question.choices as { key: string; correct: boolean }[];
  const correct = choices.find((c) => c.correct);
  const isCorrect = parsed.data.chosenKey === correct?.key;

  const { error: insertErr } = await supabase.from("attempts").insert({
    user_id: user.id,
    question_id: question.id,
    simulado_id: parsed.data.simuladoId,
    chosen_key: parsed.data.chosenKey,
    is_correct: isCorrect,
    time_ms: parsed.data.timeMs ?? null,
    xp_awarded: 0, // simulado não dá XP por questão; XP vem na conclusão
    mode: "simulado" as const,
  });
  if (insertErr) return { error: "falha_persistir" } as const;

  return { ok: true as const };
}

const FinishSchema = z.object({ simuladoId: z.string().uuid() });

export async function finishSimulado(input: z.infer<typeof FinishSchema>) {
  const parsed = FinishSchema.safeParse(input);
  if (!parsed.success) return { error: "input_invalido" } as const;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "sem_sessao" } as const;

  // Calcula score: count correct / count total
  const { data: attempts } = await supabase
    .from("attempts")
    .select("is_correct")
    .eq("simulado_id", parsed.data.simuladoId)
    .eq("user_id", user.id);

  const total = attempts?.length ?? 0;
  const correctCount = attempts?.filter((a) => a.is_correct).length ?? 0;
  const score = total > 0 ? correctCount / total : 0;

  // XP: 50 + 1 por % acerto (ver docs/GAMIFICATION.md)
  const xpAwarded = 50 + Math.round(score * 100);

  const { error: simErr } = await supabase
    .from("simulados")
    .update({
      finished_at: new Date().toISOString(),
      score,
    })
    .eq("id", parsed.data.simuladoId)
    .eq("user_id", user.id);
  if (simErr) return { error: "falha_finalizar" } as const;

  // Adiciona XP no profile (não passa por trigger; é XP fora do log)
  const { data: profile } = await supabase
    .from("profiles").select("xp_total").eq("id", user.id).single();
  await supabase.from("profiles").update({
    xp_total: (profile?.xp_total ?? 0) + xpAwarded,
  }).eq("id", user.id);

  return { ok: true as const, score, xpAwarded, total, correct: correctCount };
}
