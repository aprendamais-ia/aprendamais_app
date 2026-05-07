"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { setActiveTrack } from "./actions";

type Track = {
  id: string;
  slug: string;
  name: string;
  issuer: string;
  exam_format: { questions?: number; duration_min?: number; status_note?: string } | null;
};

type Progress = { totalLessons: number; completedLessons: number };

type Props = {
  track: Track;
  progress: Progress | null;
  state: "active" | "joined" | "available";
};

export function CourseCard({ track, progress, state }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (state === "active" || pending) return;
    startTransition(async () => {
      const res = await setActiveTrack(track.id);
      if ("ok" in res && res.ok) {
        router.push("/app");
        router.refresh();
      }
    });
  }

  const pct =
    progress && progress.totalLessons > 0
      ? Math.round((progress.completedLessons / progress.totalLessons) * 100)
      : 0;

  return (
    <button
      type="button"
      disabled={state === "active" || pending}
      onClick={handleClick}
      className={cn(
        "flex flex-col gap-2 rounded-2xl border p-4 text-left transition-colors",
        state === "active" && "border-brand-green bg-brand-green/10 cursor-default",
        state === "joined" && "border-border bg-surface hover:border-text-muted",
        state === "available" && "border-dashed border-border bg-surface hover:border-text-muted",
        pending && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-display font-semibold">{track.name}</div>
          <div className="mt-0.5 text-xs text-text-muted">{track.issuer}</div>
          {track.exam_format?.status_note && (
            <div className="mt-1 text-xs text-streak">{track.exam_format.status_note}</div>
          )}
        </div>
        <Badge state={state} pending={pending} />
      </div>

      {state !== "available" && progress && progress.totalLessons > 0 && (
        <>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-brand-green transition-[width]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-xs text-text-muted">
            {progress.completedLessons} de {progress.totalLessons} fases concluídas · {pct}%
          </div>
        </>
      )}
    </button>
  );
}

function Badge({ state, pending }: { state: "active" | "joined" | "available"; pending: boolean }) {
  if (pending) {
    return (
      <span className="flex shrink-0 items-center gap-1 text-xs text-text-muted">
        <Loader2 className="size-3.5 animate-spin" />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-green/20 px-2 py-0.5 text-xs font-medium text-brand-green">
        <Check className="size-3.5" />
        Ativo
      </span>
    );
  }
  if (state === "joined") {
    return (
      <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-text-muted">
        Estudar
        <ArrowRight className="size-3.5" />
      </span>
    );
  }
  return (
    <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-brand-green">
      <Plus className="size-3.5" />
      Adicionar
    </span>
  );
}
