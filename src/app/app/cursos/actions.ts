"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const TrackIdSchema = z.string().uuid();

/**
 * Pega um curso (track): cria registro em user_tracks (idempotente) e
 * promove ele a curso ativo (profiles.primary_track_id). Atualiza
 * last_active_at pra refletir uso atual.
 */
export async function setActiveTrack(trackId: string) {
  const parsed = TrackIdSchema.safeParse(trackId);
  if (!parsed.success) return { error: "ID inválido" } as const;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "sem_sessao" } as const;

  const { data: track } = await supabase
    .from("tracks")
    .select("id, active")
    .eq("id", parsed.data)
    .single();
  if (!track || !track.active) return { error: "Curso indisponível" } as const;

  // Upsert em user_tracks (last_active_at atualiza no upsert ou via update)
  const { error: utErr } = await supabase
    .from("user_tracks")
    .upsert(
      { user_id: user.id, track_id: parsed.data, last_active_at: new Date().toISOString() },
      { onConflict: "user_id,track_id" },
    );
  if (utErr) return { error: utErr.message } as const;

  // Promove a curso ativo
  const { error: profErr } = await supabase
    .from("profiles")
    .update({ primary_track_id: parsed.data })
    .eq("id", user.id);
  if (profErr) return { error: profErr.message } as const;

  revalidatePath("/app");
  revalidatePath("/app/cursos");
  return { ok: true } as const;
}
