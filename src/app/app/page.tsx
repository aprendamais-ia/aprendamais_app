import { redirect } from "next/navigation";
import Link from "next/link";
import { Flame, Zap, Heart, ChevronDown, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Wordmark } from "@/components/logo";
import { LearningPath, type Phase } from "@/components/learning-path";
import { WeeklyStreak, computeWeekDays } from "@/components/weekly-streak";
import { ApprovalGauge } from "@/components/approval-gauge";
import { LifeRegenChime } from "./life-regen-chime";
import { AchievementChime, type AchievementUnlock } from "./achievement-chime";
import { SignOutButton } from "./sign-out-button";

export const metadata = { title: "Início" };

export default async function AppHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  // Lê lives antes de claim_lives pra detectar regeneração e disparar
  // playLifeRegen no client.
  const { data: livesBeforeRow } = await supabase
    .from("profiles")
    .select("lives")
    .eq("id", user.id)
    .single();
  const livesBefore = livesBeforeRow?.lives ?? 5;

  await supabase.rpc("claim_lives");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, xp_total, lives, streak_days, onboarded_at, primary_track_id")
    .eq("id", user.id)
    .single();

  const livesAdded = Math.max(0, (profile?.lives ?? livesBefore) - livesBefore);

  if (!profile?.onboarded_at) redirect("/onboarding");

  let activeTrack: { id: string; name: string } | null = null;
  if (profile.primary_track_id) {
    const { data: track } = await supabase
      .from("tracks")
      .select("id, name")
      .eq("id", profile.primary_track_id)
      .single();
    activeTrack = track ?? null;
  }

  const phases = await loadPhases(supabase, user.id, profile.primary_track_id);
  const weekDays = computeWeekDays();
  const attemptedDates = await loadAttemptedDatesThisWeek(supabase, user.id, weekDays);
  const approval = await loadApproval(supabase, user.id, profile.primary_track_id);

  const { data: newAchievements } = await supabase.rpc("claim_new_achievements");
  const achievementUnlocks: AchievementUnlock[] = ((newAchievements ?? []) as Array<{
    code: string;
    name: string;
    description: string;
    icon: string;
  }>).map((a) => ({
    code: a.code,
    name: a.name,
    description: a.description,
    icon: a.icon,
  }));

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-8 pb-28">
      <LifeRegenChime livesAdded={livesAdded} />
      <AchievementChime unlocks={achievementUnlocks} />
      <header className="flex items-center justify-between">
        <Wordmark />
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1">
            <Heart className="size-4 text-error" />
            {profile?.lives ?? 5}
          </span>
          <span className="flex items-center gap-1">
            <Flame className="size-4 text-streak" />
            {profile?.streak_days ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <Zap className="size-4 text-brand-yellow" />
            {profile?.xp_total ?? 0}
          </span>
        </div>
      </header>

      <section className="mt-8 flex flex-1 flex-col">
        <Link
          href="/app/cursos"
          className="btn-squash -ml-1 inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-surface"
          aria-label="Trocar curso"
        >
          <BookOpen className="size-3.5" />
          {activeTrack?.name ?? "Escolher curso"}
          <ChevronDown className="size-3.5" />
        </Link>

        <h1 className="mt-2 font-display text-2xl font-bold">
          Oi, {profile?.display_name ?? user.email}.
        </h1>
        <p className="mt-1 text-sm text-text-muted">Sua trilha tá te esperando.</p>

        {approval && activeTrack && (
          <ApprovalGauge
            className="mt-6"
            probability={approval.probability}
            trackName={activeTrack.name}
            topTopicName={approval.topTopicName}
            topTopicUplift={approval.topTopicUplift}
          />
        )}

        <WeeklyStreak days={weekDays} attemptedDates={attemptedDates} />

        <LearningPath phases={phases} />
      </section>

      <SignOutButton />
    </main>
  );
}

async function loadPhases(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  trackId: string | null,
): Promise<Phase[]> {
  if (!trackId) return [];

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, level, position, question_ids, topics!inner(track_id)")
    .eq("published", true)
    .eq("topics.track_id", trackId)
    .order("level")
    .order("position");

  if (!lessons?.length) return [];

  const lessonIds = lessons.map((l) => l.id as string);
  const { data: attempts } = await supabase
    .from("attempts")
    .select("lesson_id, question_id")
    .eq("user_id", userId)
    .in("lesson_id", lessonIds);

  const attemptedByLesson = new Map<string, Set<string>>();
  for (const a of attempts ?? []) {
    if (!a.lesson_id) continue;
    const set = attemptedByLesson.get(a.lesson_id) ?? new Set<string>();
    set.add(a.question_id as string);
    attemptedByLesson.set(a.lesson_id, set);
  }

  let foundActive = false;
  return lessons.map((lesson) => {
    const total = (lesson.question_ids as string[]).length;
    const attemptedSet = attemptedByLesson.get(lesson.id as string) ?? new Set();
    const completed = total > 0 && attemptedSet.size >= total;
    let state: Phase["state"];
    if (completed) {
      state = "completed";
    } else if (!foundActive) {
      state = "active";
      foundActive = true;
    } else {
      state = "locked";
    }
    return { id: lesson.id as string, title: lesson.title as string, state };
  });
}

async function loadApproval(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  trackId: string | null,
): Promise<{
  probability: number;
  topTopicName: string | null;
  topTopicUplift: number | null;
} | null> {
  if (!trackId) return null;

  const { data } = await supabase.rpc("calc_approval_probability", {
    p_user_id: userId,
    p_track_id: trackId,
  });

  // RPC retorna table — supabase-js devolve array
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  return {
    probability: Number(row.probability ?? 0.5),
    topTopicName: (row.top_topic_name as string | null) ?? null,
    topTopicUplift:
      row.top_topic_uplift !== null && row.top_topic_uplift !== undefined
        ? Number(row.top_topic_uplift)
        : null,
  };
}

async function loadAttemptedDatesThisWeek(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  weekDays: ReturnType<typeof computeWeekDays>,
): Promise<string[]> {
  const startDate = weekDays[0].date; // segunda da semana atual em BRT
  // Buffer de 1 dia pra cobrir fuso na borda
  const startISO = new Date(`${startDate}T00:00:00-03:00`).toISOString();

  const { data: attempts } = await supabase
    .from("attempts")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", startISO);

  if (!attempts?.length) return [];

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

  const set = new Set<string>();
  for (const a of attempts) {
    if (a.created_at) set.add(fmt(new Date(a.created_at as string)));
  }
  return Array.from(set);
}
