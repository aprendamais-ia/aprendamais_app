"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  trackId: z.string().uuid(),
  dailyGoalMin: z.number().int().positive().max(240),
  examDate: z.string().date().nullable(),
});

export async function completeOnboarding(input: z.infer<typeof Schema>) {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos. Tenta de novo." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sem sessão. Entra de novo." };

  const { error: profErr } = await supabase
    .from("profiles")
    .update({
      primary_track_id: parsed.data.trackId,
      target_exam_date: parsed.data.examDate,
      onboarded_at: new Date().toISOString(),
      // dailyGoalMin ainda não tem coluna; vai junto numa preferences jsonb futura
    })
    .eq("id", user.id);

  if (profErr) {
    return { error: "Não rolou salvar. Tenta de novo." };
  }

  // Materializa o curso ativo em user_tracks pra UI multi-curso saber
  // que o user "pegou" esse track (idempotente)
  const { error: utErr } = await supabase
    .from("user_tracks")
    .upsert(
      { user_id: user.id, track_id: parsed.data.trackId },
      { onConflict: "user_id,track_id" },
    );
  if (utErr) {
    // Não bloqueia o onboarding — log e segue. O fallback /app/cursos
    // pode ressincronizar depois.
    console.error("user_tracks upsert falhou:", utErr.message);
  }

  return { ok: true };
}
