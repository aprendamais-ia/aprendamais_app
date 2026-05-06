import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SimuladoPlayer } from "./simulado-player";

export const metadata = { title: "Simulado em andamento" };

type Choice = { key: string; text: string };

export default async function SimuladoPlayerPage({
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
    .select("id, started_at, finished_at, question_ids, track_id, tracks!inner(exam_format)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!simulado) notFound();

  if (simulado.finished_at) {
    redirect(`/app/simulado/${id}/resultado`);
  }

  const examFormat =
    (simulado as unknown as { tracks: { exam_format: { duration_min?: number } } })
      .tracks?.exam_format ?? {};
  const durationMin = examFormat.duration_min ?? 60;

  const questionIds = simulado.question_ids as string[];
  const { data: questions } = await supabase
    .from("questions")
    .select("id, stem, choices")
    .in("id", questionIds)
    .eq("status", "published");

  const byId = new Map((questions ?? []).map((q) => [q.id, q]));
  const ordered = questionIds
    .map((qid) => byId.get(qid))
    .filter((q): q is NonNullable<typeof q> => Boolean(q))
    .map((q) => ({
      id: q.id,
      stem: q.stem as string,
      choices: (q.choices as { key: string; text: string }[]).map((c) => ({
        key: c.key,
        text: c.text,
      })) as Choice[],
    }));

  return (
    <SimuladoPlayer
      simuladoId={simulado.id}
      startedAt={simulado.started_at}
      durationMin={durationMin}
      questions={ordered}
    />
  );
}
