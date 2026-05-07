import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowDown, ArrowUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Leaderboard } from "./leaderboard";
import { LeagueCountdown } from "./countdown";
import { TIER_NAMES, nextTier, prevTier, type Tier } from "./tiers";

export const metadata = { title: "Liga" };

export default async function LigaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  await supabase.rpc("ensure_league_membership", { p_user_id: user.id });

  const { data: weekData } = await supabase.rpc("current_week_start_brt");
  const weekStart = weekData as string;

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
  const tier = (((membership as unknown as { leagues: { tier: string } }).leagues?.tier) ?? "bronze") as Tier;

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

  const promoTier = nextTier(tier);
  const demoTier = prevTier(tier);
  const isTopTier = tier === "lendas";
  const isBottomTier = tier === "bronze";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
      <Link href="/app" className="flex items-center gap-1 text-sm text-text-muted">
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <header className="mt-8">
        <span className="text-xs font-medium text-text-muted">Liga semanal</span>
        <h1 className="mt-1 font-display text-3xl font-bold">{TIER_NAMES[tier]}</h1>
        <LeagueCountdown />
      </header>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {!isTopTier ? (
          <ZoneBadge
            tone="up"
            icon={<ArrowUp className="size-3.5" />}
            title="Top 10 sobem"
            sub={`para ${TIER_NAMES[promoTier]}`}
          />
        ) : (
          <ZoneBadge tone="up" icon={<ArrowUp className="size-3.5" />} title="Hall da Glória" sub="topo da pirâmide" />
        )}
        {!isBottomTier ? (
          <ZoneBadge
            tone="down"
            icon={<ArrowDown className="size-3.5" />}
            title="Bottom 5 caem"
            sub={`para ${TIER_NAMES[demoTier]}`}
          />
        ) : (
          <ZoneBadge tone="down" icon={<ArrowDown className="size-3.5" />} title="Sem rebaixamento" sub="já é o piso" />
        )}
      </div>

      <Leaderboard
        leagueId={leagueId}
        currentUserId={user.id}
        initialMembers={initialMembers}
        canDemote={!isBottomTier}
      />
    </main>
  );
}

function ZoneBadge({
  tone,
  icon,
  title,
  sub,
}: {
  tone: "up" | "down";
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div
      className={
        tone === "up"
          ? "flex items-start gap-2 rounded-2xl border border-success/30 bg-success/10 px-3 py-2"
          : "flex items-start gap-2 rounded-2xl border border-error/30 bg-error/10 px-3 py-2"
      }
    >
      <span
        className={
          tone === "up"
            ? "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-success/20 text-success"
            : "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-error/20 text-error"
        }
      >
        {icon}
      </span>
      <div className="leading-tight">
        <div className="font-medium">{title}</div>
        <div className="text-text-muted">{sub}</div>
      </div>
    </div>
  );
}
