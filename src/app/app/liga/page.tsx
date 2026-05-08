import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Trophy, ArrowUp, ArrowDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Leaderboard } from "./leaderboard";
import { LeagueCountdown } from "./countdown";
import { LeagueBadge, type LeagueTier, type Division } from "@/components/league-badge";

export const metadata = { title: "Liga" };

export default async function LigaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, primary_track_id, current_league_tier, current_league_division")
    .eq("id", user.id)
    .single();

  if (!profile?.primary_track_id) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-8 pb-28">
        <Link href="/app" className="flex items-center gap-1 text-sm text-text-muted">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
        <section className="mt-16 flex flex-col items-center text-center">
          <Trophy className="size-12 text-text-muted" />
          <h1 className="mt-4 font-display text-2xl font-bold">Sem curso ativo</h1>
          <p className="mt-2 text-sm text-text-muted">
            Escolhe um curso pra entrar no ranking semanal.
          </p>
          <Link
            href="/app/cursos"
            className="mt-6 flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand-green px-6 font-display font-semibold text-brand-green-fg"
          >
            <BookOpen className="size-4" />
            Ver cursos
          </Link>
        </section>
      </main>
    );
  }

  const { data: track } = await supabase
    .from("tracks")
    .select("id, name")
    .eq("id", profile.primary_track_id)
    .single();

  type RankRow = {
    user_id: string;
    display_name: string;
    weekly_xp: number;
    rank: number;
  };

  type RpcRow = {
    user_id: string;
    display_name: string | null;
    weekly_xp: number | string;
    rank: number;
  };

  const { data: ranking } = await supabase.rpc("weekly_ranking_by_track", {
    p_track_id: profile.primary_track_id,
  });

  const initialRows: RankRow[] = ((ranking ?? []) as RpcRow[]).map((r) => ({
    user_id: r.user_id,
    display_name: r.display_name ?? "Aluno",
    weekly_xp: Number(r.weekly_xp ?? 0),
    rank: Number(r.rank ?? 0),
  }));

  // Se o user atual não fez XP esta semana, ele não aparece no ranking.
  // Acrescentamos uma "linha fantasma" no fim com 0 XP só pra ele se enxergar.
  const currentInList = initialRows.some((r) => r.user_id === user.id);
  const ghostRow: RankRow | null = currentInList
    ? null
    : {
        user_id: user.id,
        display_name: profile?.display_name ?? "Você",
        weekly_xp: 0,
        rank: initialRows.length + 1,
      };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-8 pb-28">
      <Link href="/app" className="flex items-center gap-1 text-sm text-text-muted">
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <header className="mt-8 flex flex-col items-center gap-3 text-center">
        <span className="text-xs font-medium text-text-muted">Liga semanal</span>
        <LeagueBadge
          tier={(profile.current_league_tier ?? "bronze") as LeagueTier}
          division={((profile.current_league_division ?? 1) as Division)}
          size="lg"
        />
        <p className="text-sm text-text-muted">
          {track?.name ?? "Curso"} · <LeagueCountdown inline />
        </p>
      </header>

      <div className="mt-6 flex items-center justify-center gap-4 rounded-2xl border border-border bg-surface px-4 py-3 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <ArrowUp className="size-3.5 text-success" />
          Top 10 sobem
        </span>
        <span className="h-3 w-px bg-border" />
        <span className="flex items-center gap-1">
          <ArrowDown className="size-3.5 text-error" />
          Bottom 5 descem
        </span>
      </div>

      <Leaderboard
        currentUserId={user.id}
        rows={initialRows}
        ghostRow={ghostRow}
      />
    </main>
  );
}
