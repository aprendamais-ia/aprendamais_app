import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CourseCard } from "./course-card";

export const metadata = { title: "Cursos" };

type TrackRow = {
  id: string;
  slug: string;
  name: string;
  issuer: string;
  exam_format: { questions?: number; duration_min?: number; status_note?: string } | null;
};

export default async function CursosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: profile } = await supabase
    .from("profiles")
    .select("primary_track_id")
    .eq("id", user.id)
    .single();
  const activeTrackId = profile?.primary_track_id ?? null;

  // Cursos ativos no catálogo
  const { data: tracks } = await supabase
    .from("tracks")
    .select("id, slug, name, issuer, exam_format")
    .eq("active", true)
    .order("name");
  const allTracks = (tracks ?? []) as TrackRow[];

  // Cursos que o usuário já pegou
  const { data: userTracks } = await supabase
    .from("user_tracks")
    .select("track_id, joined_at, last_active_at")
    .eq("user_id", user.id);
  const joinedSet = new Set((userTracks ?? []).map((ut) => ut.track_id as string));

  // Progresso por track: lições publicadas vs lições com todas as questões respondidas
  const progressByTrack = await loadProgressByTrack(supabase, user.id, allTracks);

  const myCourses = allTracks.filter((t) => joinedSet.has(t.id));
  const otherCourses = allTracks.filter((t) => !joinedSet.has(t.id));

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
      <Link href="/app" className="flex items-center gap-1 text-sm text-text-muted">
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <header className="mt-8">
        <h1 className="font-display text-3xl font-bold">Cursos</h1>
        <p className="mt-1 text-sm text-text-muted">
          Estuda mais de uma certificação ao mesmo tempo. O progresso de cada curso fica salvo.
        </p>
      </header>

      {myCourses.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-text-muted">
            Em andamento
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {myCourses.map((t) => (
              <CourseCard
                key={t.id}
                track={t}
                progress={progressByTrack.get(t.id) ?? null}
                state={t.id === activeTrackId ? "active" : "joined"}
              />
            ))}
          </div>
        </section>
      )}

      {otherCourses.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-text-muted">
            Outros cursos
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {otherCourses.map((t) => (
              <CourseCard
                key={t.id}
                track={t}
                progress={null}
                state="available"
              />
            ))}
          </div>
        </section>
      )}

      {myCourses.length === 0 && otherCourses.length === 0 && (
        <p className="mt-12 text-text-muted">Nenhum curso ativo no catálogo.</p>
      )}

      <div className="h-8" />

      {otherCourses.length > 0 && (
        <p className="text-xs text-text-muted">
          <Plus className="mr-1 inline size-3" />
          Adicionar um curso não remove os outros. Tudo fica salvo.
        </p>
      )}
    </main>
  );
}

type Progress = { totalLessons: number; completedLessons: number };

async function loadProgressByTrack(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  tracks: TrackRow[],
): Promise<Map<string, Progress>> {
  if (tracks.length === 0) return new Map();

  // Pega todas as lições publicadas dos tracks (1 query)
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, question_ids, topics!inner(track_id)")
    .eq("published", true)
    .in(
      "topics.track_id",
      tracks.map((t) => t.id),
    );

  if (!lessons?.length) return new Map();

  type Lesson = { id: string; questionCount: number; trackId: string };
  const lessonList: Lesson[] = lessons.map((l) => ({
    id: l.id as string,
    questionCount: (l.question_ids as string[]).length,
    trackId: ((l as unknown as { topics: { track_id: string } }).topics).track_id,
  }));

  // Pega attempts do user para essas lições
  const lessonIds = lessonList.map((l) => l.id);
  const { data: attempts } = await supabase
    .from("attempts")
    .select("lesson_id, question_id")
    .eq("user_id", userId)
    .in("lesson_id", lessonIds);

  const distinctByLesson = new Map<string, Set<string>>();
  for (const a of attempts ?? []) {
    if (!a.lesson_id) continue;
    const set = distinctByLesson.get(a.lesson_id as string) ?? new Set<string>();
    set.add(a.question_id as string);
    distinctByLesson.set(a.lesson_id as string, set);
  }

  const acc = new Map<string, Progress>();
  for (const t of tracks) acc.set(t.id, { totalLessons: 0, completedLessons: 0 });

  for (const l of lessonList) {
    const p = acc.get(l.trackId)!;
    p.totalLessons += 1;
    const answered = distinctByLesson.get(l.id)?.size ?? 0;
    if (l.questionCount > 0 && answered >= l.questionCount) p.completedLessons += 1;
  }

  return acc;
}
