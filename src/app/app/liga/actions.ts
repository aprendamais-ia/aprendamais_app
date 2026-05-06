"use server";

import { createClient } from "@/lib/supabase/server";

export async function ensureLeagueMembership() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "sem_sessao" } as const;

  const { data, error } = await supabase.rpc("ensure_league_membership", {
    p_user_id: user.id,
  });
  if (error) return { error: error.message } as const;
  return { ok: true as const, leagueId: data as string };
}
