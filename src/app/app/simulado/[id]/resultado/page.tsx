import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Resultado" };

export default async function SimuladoResultadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: simulado } = await supabase
    .from("simulados")
    .select("id, started_at, finished_at, score, question_ids, track_id, tracks!inner(name, exam_format)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!simulado || !simulado.finished_at) notFound();

  const total = (simulado.question_ids as string[]).length;
  const score = (simulado.score as number) ?? 0;
  const correct = Math.round(score * total);

  const examFormat =
    (simulado as unknown as { tracks: { name: string; exam_format: { passing_score?: number } } })
      .tracks?.exam_format ?? {};
  const passingScore = examFormat.passing_score ?? 0.5;
  const passed = score >= passingScore;

  // Breakdown por tópico-módulo
  const { data: attempts } = await supabase
    .from("attempts")
    .select("is_correct, questions!inner(topic_id, topics!inner(parent_id, name))")
    .eq("simulado_id", id);

  const byModule: Record<string, { correct: number; total: number }> = {};
  for (const a of attempts ?? []) {
    const topic = (a as unknown as { questions: { topics: { parent_id: string | null; name: string } } }).questions?.topics;
    if (!topic) continue;
    const key = topic.name;
    if (!byModule[key]) byModule[key] = { correct: 0, total: 0 };
    byModule[key].total += 1;
    if (a.is_correct) byModule[key].correct += 1;
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
      <Link href="/app/simulado" className="flex items-center gap-1 text-sm text-text-muted">
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <section className="mt-12 flex flex-col items-center text-center">
        <div
          className={`flex size-24 items-center justify-center rounded-full ${
            passed ? "bg-brand-green/15" : "bg-streak/15"
          }`}
        >
          <Trophy className={`size-12 ${passed ? "text-brand-green" : "text-streak"}`} />
        </div>
        <h1 className="mt-6 font-display text-4xl font-bold">{Math.round(score * 100)}%</h1>
        <p className="mt-1 text-text-muted">
          {correct} de {total} questões
        </p>
        <p className={`mt-3 text-sm font-medium ${passed ? "text-brand-green" : "text-streak"}`}>
          {passed ? "Tu passaria. Bora consolidar." : `Ainda não bateu os ${Math.round(passingScore * 100)}%. Mais reps.`}
        </p>
      </section>

      <section className="mt-10 rounded-2xl bg-surface p-5">
        <div className="flex items-center gap-2 text-sm">
          <Zap className="size-4 text-brand-yellow" />
          <span className="font-medium">+{50 + Math.round(score * 100)} XP recebidos</span>
        </div>
      </section>

      {Object.keys(byModule).length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold">Por matéria</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {Object.entries(byModule)
              .sort(([, a], [, b]) => b.total - a.total)
              .map(([name, stats]) => {
                const pct = Math.round((stats.correct / stats.total) * 100);
                return (
                  <li key={name} className="rounded-2xl border border-border bg-surface p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{name}</span>
                      <span className="text-text-muted">
                        {stats.correct}/{stats.total} · {pct}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full bg-brand-green transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
          </ul>
        </section>
      )}

      <Link
        href="/app"
        className="mt-auto flex h-14 items-center justify-center rounded-2xl bg-brand-green font-display text-lg font-semibold text-brand-green-fg shadow-sm"
      >
        Voltar pro início
      </Link>
    </main>
  );
}
