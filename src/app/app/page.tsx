import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Flame, Zap, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export const metadata = { title: "Início" };

export default async function AppHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, xp_total, lives, streak_days, onboarded_at, primary_track_id")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarded_at) redirect("/onboarding");

  // Primeira lição publicada — começamos pela trilha primária do usuário,
  // mas o MVP só tem demo OAB seedado, então pegamos qualquer published.
  const { data: nextLesson } = await supabase
    .from("lessons")
    .select("id, title, intro, level, position")
    .eq("published", true)
    .order("level")
    .order("position")
    .limit(1)
    .maybeSingle();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
      <header className="flex items-center justify-between">
        <span className="font-display text-xl font-bold">Aprenda Mais</span>
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

      <section className="mt-10 flex flex-1 flex-col">
        <h1 className="font-display text-2xl font-bold">
          Oi, {profile?.display_name ?? user.email}.
        </h1>

        {nextLesson ? (
          <Link
            href={`/app/licao/${nextLesson.id}`}
            className="mt-6 flex items-center justify-between rounded-2xl bg-brand-green p-5 text-brand-green-fg shadow-sm transition-transform active:scale-[0.98]"
          >
            <div>
              <div className="text-xs font-medium opacity-80">Próxima lição</div>
              <div className="mt-1 font-display text-lg font-semibold">{nextLesson.title}</div>
              {nextLesson.intro && (
                <div className="mt-1 text-xs opacity-80 line-clamp-2">{nextLesson.intro}</div>
              )}
            </div>
            <ArrowRight className="size-6 shrink-0" />
          </Link>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-5 text-center">
            <p className="text-sm text-text-muted">
              Nenhuma lição publicada ainda. Roda{" "}
              <code className="font-mono text-xs">pnpm db:seed-demo</code> pra liberar a primeira.
            </p>
          </div>
        )}

        <div className="mt-8 rounded-2xl bg-surface p-5">
          <p className="text-sm font-medium">Próximos passos</p>
          <ul className="mt-3 space-y-2 text-sm text-text-muted">
            <li>• Teste de nível inicial (em breve)</li>
            <li>• Modo simulado (em breve)</li>
            <li>• Ligas semanais (em breve)</li>
          </ul>
        </div>
      </section>

      <SignOutButton />
    </main>
  );
}
