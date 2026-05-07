import { Check, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export type WeekDay = {
  date: string; // YYYY-MM-DD em BRT
  label: string; // "Seg", "Ter", ...
  isToday: boolean;
  isFuture: boolean;
};

type Props = {
  days: WeekDay[];
  attemptedDates: string[];
};

export function WeeklyStreak({ days, attemptedDates }: Props) {
  const attempted = new Set(attemptedDates);
  const practicedThisWeek = days.filter((d) => attempted.has(d.date)).length;

  return (
    <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="size-4 text-streak" />
          <span className="text-sm font-medium">Tua semana</span>
        </div>
        <span className="text-xs text-text-muted">
          {practicedThisWeek}/7 dias
        </span>
      </div>
      <div className="mt-3 flex justify-between gap-1.5">
        {days.map((d) => {
          const done = attempted.has(d.date);
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={cn(
                  "text-[10px] font-medium uppercase tracking-wide",
                  d.isToday ? "text-brand-green" : "text-text-muted",
                )}
              >
                {d.label}
              </span>
              <div
                className={cn(
                  "flex aspect-square w-full items-center justify-center rounded-lg border text-xs font-semibold transition-colors",
                  done && "border-brand-green bg-brand-green text-brand-green-fg",
                  !done && d.isToday && "border-brand-green bg-brand-green/10 text-brand-green ring-2 ring-brand-green/30",
                  !done && !d.isToday && d.isFuture && "border-dashed border-border bg-transparent text-text-muted/40",
                  !done && !d.isToday && !d.isFuture && "border-border bg-surface-elevated text-text-muted/60",
                )}
                aria-label={
                  done
                    ? `${d.label}: praticou`
                    : d.isToday
                      ? `${d.label}: hoje, ainda não praticou`
                      : d.isFuture
                        ? `${d.label}: futuro`
                        : `${d.label}: não praticou`
                }
              >
                {done && <Check className="size-3.5" strokeWidth={3.5} />}
                {!done && d.isToday && <span className="size-1.5 rounded-full bg-brand-green" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function computeWeekDays(now = new Date()): WeekDay[] {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const todayStr = fmt(now);

  // "Now" interpretado como wall clock em BRT
  const brtNow = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const dow = brtNow.getDay(); // 0=Dom..6=Sáb
  const daysSinceMon = (dow + 6) % 7; // 0 se segunda

  const labels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

  const days: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(brtNow);
    d.setDate(brtNow.getDate() - daysSinceMon + i);
    const dateStr = fmt(d);
    days.push({
      date: dateStr,
      label: labels[i],
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
    });
  }
  return days;
}
