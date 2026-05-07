import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LessonPlayer } from "./lesson-player";
import { OutOfLives } from "./out-of-lives";

export const metadata = { title: "Lição" };

type Choice = { key: string; text: string; correct: boolean };

export default async function LicaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  await supabase.rpc("claim_lives");

  const { data: profile } = await supabase
    .from("profiles")
    .select("lives, lives_regen_at")
    .eq("id", user.id)
    .single();

  if (profile && profile.lives <= 0) {
    return <OutOfLives livesRegenAt={profile.lives_regen_at as string | null} />;
  }

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, intro, outro, question_ids, published")
    .eq("id", id)
    .single();

  if (!lesson || !lesson.published) notFound();

  const questionIds = lesson.question_ids as string[];
  if (!questionIds?.length) notFound();

  const { data: questions } = await supabase
    .from("questions")
    .select("id, difficulty, stem, choices")
    .in("id", questionIds)
    .eq("status", "published");

  if (!questions?.length) notFound();

  // Manter ordem do question_ids da lição
  const byId = new Map(questions.map((q) => [q.id, q]));
  const ordered = questionIds
    .map((qid) => byId.get(qid))
    .filter((q): q is NonNullable<typeof q> => Boolean(q))
    .map((q) => ({
      id: q.id,
      difficulty: q.difficulty as number,
      stem: q.stem as string,
      // Não enviar `correct` pro cliente — server action valida.
      choices: (q.choices as Choice[]).map((c) => ({ key: c.key, text: c.text })),
    }));

  return (
    <LessonPlayer
      lessonId={lesson.id}
      title={lesson.title}
      intro={lesson.intro}
      outro={lesson.outro}
      questions={ordered}
      initialLives={profile?.lives ?? 5}
    />
  );
}
