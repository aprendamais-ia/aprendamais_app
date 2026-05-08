"use client";

import { useEffect, useState } from "react";
import { Sparkles, Flame, CheckCircle, Trophy, Medal, Crown } from "lucide-react";
import { playAchievement } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export type AchievementUnlock = {
  code: string;
  name: string;
  description: string;
  icon: string;
};

type Props = {
  unlocks: AchievementUnlock[];
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  flame: Flame,
  "check-circle": CheckCircle,
  trophy: Trophy,
  medal: Medal,
  crown: Crown,
};

const TOAST_DURATION_MS = 2800;

// Mostra um toast por achievement, sequencial. Toca playAchievement no
// momento em que cada toast aparece.
export function AchievementChime({ unlocks }: Props) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (unlocks.length === 0) return;
    if (idx >= unlocks.length) return;

    setVisible(true);
    playAchievement();

    const hideTimer = setTimeout(() => setVisible(false), TOAST_DURATION_MS - 300);
    const advanceTimer = setTimeout(() => setIdx((n) => n + 1), TOAST_DURATION_MS);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(advanceTimer);
    };
  }, [idx, unlocks]);

  if (unlocks.length === 0 || idx >= unlocks.length) return null;

  const u = unlocks[idx];
  const Icon = ICON_MAP[u.icon] ?? Sparkles;

  return (
    <div
      className={cn(
        "pointer-events-none fixed left-1/2 top-6 z-50 -translate-x-1/2 transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-2xl border-2 border-brand-yellow bg-surface-elevated px-4 py-3 shadow-lg">
        <div className="flex size-10 items-center justify-center rounded-full bg-brand-yellow/20">
          <Icon className="size-5 text-brand-yellow" />
        </div>
        <div className="text-left">
          <p className="text-[10px] font-medium uppercase tracking-wider text-brand-yellow">
            Conquista desbloqueada
          </p>
          <p className="font-display text-sm font-bold leading-tight">{u.name}</p>
          <p className="text-xs text-text-muted leading-tight">{u.description}</p>
        </div>
      </div>
    </div>
  );
}
