import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Leaderboard } from "./leaderboard";

const TIER_NAMES: Record<string, string> = {
  bronze: "Bronze", prata: "Prata", ouro: "Ouro", safira: "Safira", rubi: "Rubi",
  esmeralda: "Esmeralda", ametista: "Ametista", perola: "Pérola",
  diamante: "Diamante", lendas: "Lendas",
};

export const metadata = { title: "Liga" };

export default async function LigaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  // Garante que o user tem membership na semana corrente (idempotente)
  await supabase.rpc("ensure_league_membership", { p_user_id: user.id });

  // Busca a semana atual
  const { data: weekData } = await supabase.rpc("current_week_start_brt");
  const weekStart = weekData as string;

  // Busca a liga do usuário nessa semana
  const { data: membership } = await supabase
    .from("league_members")
    .select("league_id, leagues!inner(tier, week_start)")
    .eq("user_id", user.id)
    .eq("leagues.week_start", weekStart)
    .single();

  if (!membership) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
        <Link href="/app" className="flex items-center gap-1 text-sm text-text-muted">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
        <p className="mt-12 text-text-muted">Sem liga ativa essa semana.</p>
      </main>
    );
  }

  const leagueId = membership.league_id as string;
  const tier = ((membership as unknown as { leagues: { tier: string } }).leagues?.tier) ?? "bronze";

  // Busca top 30 da liga
  const { data: members } = await supabase
    .from("league_members")
    .select("user_id, weekly_xp, profiles!inner(display_name, avatar_url)")
    .eq("league_id", leagueId)
    .order("weekly_xp", { ascending: false })
    .limit(30);

  const initialMembers = (members ?? []).map((m, i) => ({
    user_id: m.user_id as string,
    weekly_xp: m.weekly_xp as number,
    display_name:
      (m as unknown as { profiles: { display_name: string | null } }).profiles?.display_name ?? "Aluno",
    rank: i + 1,
  }));

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
      <Link href="/app" className="flex items-center gap-1 text-sm text-text-muted">
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <header className="mt-8">
        <span className="text-xs font-medium text-text-muted">Liga semanal</span>
        <h1 className="mt-1 font-display text-3xl font-bold">{TIER_NAMES[tier] ?? tier}</h1>
        <p className="mt-1 text-sm text-text-muted">
          Top 10 sobem · Bottom 5 caem · Reset toda segunda
        </p>
      </header>

      <Leaderboard
        leagueId={leagueId}
        currentUserId={user.id}
        initialMembers={initialMembers}
      />
    </main>
  );
}
