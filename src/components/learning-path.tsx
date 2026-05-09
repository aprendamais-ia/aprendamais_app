import Link from "next/link";
import { Check, Lock, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Mascot } from "./mascot";

export type Phase = {
  id: string;
  title: string;
  state: "completed" | "active" | "locked";
};

const ZIGZAG = ["translate-x-0", "translate-x-16", "translate-x-0", "-translate-x-16"] as const;

export function LearningPath({ phases }: { phases: Phase[] }) {
  if (phases.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-border p-6 text-center">
        <Mascot size={120} className="mx-auto opacity-80" />
        <p className="mt-3 text-sm text-text-muted">
          Sua trilha tá vindo. Volta em instantes.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-3">
      {phases.map((phase, i) => {
        const offset = ZIGZAG[i % ZIGZAG.length];
        const isActive = phase.state === "active";
        const isCompleted = phase.state === "completed";
        const isLocked = phase.state === "locked";

        const node = (
          <div
            className={cn(
              "relative flex size-20 items-center justify-center rounded-full shadow-md transition-transform",
              isCompleted && "bg-brand-green text-brand-green-fg",
              isActive &&
                "bg-brand-green text-brand-green-fg ring-4 ring-brand-green/30 animate-pulse",
              isLocked && "bg-surface border-2 border-border text-text-muted",
            )}
            aria-label={
              isCompleted
                ? `Fase concluída: ${phase.title}`
                : isActive
                  ? `Fase atual: ${phase.title}`
                  : `Fase bloqueada: ${phase.title}`
            }
          >
            {isCompleted && <Check className="size-9" strokeWidth={3} />}
            {isActive && <Play className="size-8 translate-x-0.5" fill="currentColor" />}
            {isLocked && <Lock className="size-7" strokeWidth={2.5} />}
          </div>
        );

        const titlePill = (
          <div
            className={cn(
              "mt-2 max-w-[14rem] text-center text-xs font-medium",
              isLocked ? "text-text-muted" : "text-text",
            )}
          >
            {phase.title}
          </div>
        );

        return (
          <div key={phase.id} className={cn("flex flex-col items-center", offset)}>
            <div className="relative">
              {isActive && (
                <Mascot
                  size={92}
                  className="pointer-events-none absolute -left-24 -top-2 hidden sm:block"
                />
              )}
              {isLocked ? (
                <div className="cursor-not-allowed">{node}</div>
              ) : (
                <Link href={`/app/licao/${phase.id}`} className="btn-squash block">
                  {node}
                </Link>
              )}
            </div>
            {titlePill}
            {isActive && (
              <Mascot
                size={72}
                className="pointer-events-none mt-1 sm:hidden"
                ariaLabel="Zé, o coalinha, te esperando na fase atual"
              />
            )}
            {i < phases.length - 1 && (
              <div
                className={cn(
                  "mt-1 h-6 w-1 rounded-full",
                  isCompleted ? "bg-brand-green" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
