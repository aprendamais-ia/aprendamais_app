import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Clock, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StartSimuladoButton } from "./start-button";

export const metadata = { title: "Simulado" };

export default async function SimuladoIndexPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: profile } = await supabase
    .from("profiles")
    .select("primary_track_id")
    .eq("id", user.id)
    .single();
  if (!profile?.primary_track_id) redirect("/onboarding");

  const { data: track } = await supabase
    .from("tracks")
    .select("name, exam_format")
    .eq("id", profile.primary_track_id)
    .single();

  const examFormat = track?.exam_format as
    | { questions?: number; duration_min?: number; passing_score?: number }
    | null;

  const { data: past } = await supabase
    .from("simulados")
    .select("id, started_at, finished_at, score")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(5);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
      <Link href="/app" className="flex items-center gap-1 text-sm text-text-muted">
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <header className="mt-8">
        <span className="text-xs font-medium text-text-muted">Modo simulado</span>
        <h1 className="mt-1 font-display text-3xl font-bold">{track?.name}</h1>
        <p className="mt-1 text-sm text-text-muted">
          {examFormat?.questions ?? "?"} questões · {examFormat?.duration_min ?? "?"} minutos · sem feedback até o fim
        </p>
      </header>

      <section className="mt-8 rounded-2xl bg-surface p-5">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 size-5 text-brand-green" />
          <div>
            <p className="font-display font-semibold">Espelha o dia da prova</p>
            <p className="mt-1 text-sm text-text-muted">
              Sem XP por questão, sem perder vidas. Bonus de XP no final.
            </p>
          </div>
        </div>
        <StartSimuladoButton />
      </section>

      {past && past.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold">Tuas provas</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {past.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/app/simulado/${s.id}/resultado`}
                  className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {new Date(s.started_at).toLocaleDateString("pt-BR")}
                    </div>
                    <div className="text-xs text-text-muted">
                      {s.finished_at ? "Finalizado" : "Em andamento"}
                    </div>
                  </div>
                  {s.score !== null && (
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Trophy className="size-4 text-brand-yellow" />
                      {Math.round((s.score as number) * 100)}%
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
