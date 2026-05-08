import { TrendingUp, Target } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** Probabilidade [0..1] */
  probability: number;
  trackName?: string | null;
  topTopicName?: string | null;
  /** Quanto a probabilidade subiria se top_topic fosse masterizado, [0..1] */
  topTopicUplift?: number | null;
  className?: string;
};

export function ApprovalGauge({
  probability,
  trackName,
  topTopicName,
  topTopicUplift,
  className,
}: Props) {
  const pct = clamp01(probability) * 100;
  const upliftPct = topTopicUplift ? Math.round(clamp01(topTopicUplift) * 100) : 0;
  const tone = bucketTone(pct);

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-surface-elevated p-5",
        className,
      )}
    >
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted">
            Chance de passar{trackName ? ` no ${trackName}` : ""}
          </p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-4xl font-bold tabular-nums">
              {Math.round(pct)}%
            </span>
            <TrendingUp className="size-4 text-text-muted" aria-hidden />
          </p>
        </div>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-border">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700 ease-out",
            tone.bar,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {topTopicName && upliftPct > 0 && (
        <div className="mt-4 flex items-start gap-2 text-sm">
          <Target className="mt-0.5 size-4 text-brand-green" aria-hidden />
          <p className="text-text-muted">
            Próximo objetivo: dominar{" "}
            <span className="font-medium text-text">{topTopicName}</span>{" "}
            <span className="font-medium text-success">(+{upliftPct}%)</span>
          </p>
        </div>
      )}
    </section>
  );
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function bucketTone(pct: number): { bar: string } {
  if (pct < 35) return { bar: "bg-error" };
  if (pct < 60) return { bar: "bg-brand-yellow" };
  return { bar: "bg-brand-green" };
}
