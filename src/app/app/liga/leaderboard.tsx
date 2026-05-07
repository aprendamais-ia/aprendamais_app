"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Member = {
  user_id: string;
  weekly_xp: number;
  display_name: string;
  rank: number;
};

type Props = {
  leagueId: string;
  currentUserId: string;
  initialMembers: Member[];
  canDemote: boolean;
};

export function Leaderboard({ leagueId, currentUserId, initialMembers, canDemote }: Props) {
  const [members, setMembers] = useState<Member[]>(initialMembers);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`league:${leagueId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "league_members",
          filter: `league_id=eq.${leagueId}`,
        },
        (payload) => {
          const updated = payload.new as { user_id: string; weekly_xp: number };
          setMembers((curr) => {
            const next = curr.map((m) =>
              m.user_id === updated.user_id ? { ...m, weekly_xp: updated.weekly_xp } : m,
            );
            next.sort((a, b) => b.weekly_xp - a.weekly_xp);
            return next.map((m, i) => ({ ...m, rank: i + 1 }));
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leagueId]);

  if (members.length === 0) {
    return (
      <ol className="mt-6">
        <li className="rounded-2xl bg-surface p-5 text-center text-sm text-text-muted">
          Tu é o primeiro da liga. Manda lição pra subir XP.
        </li>
      </ol>
    );
  }

  // Zonas só fazem sentido se a liga tiver pelo menos 11 membros — caso
  // contrário não tem rebaixamento (vide migration 5)
  const showDemoteZone = canDemote && members.length >= 11;

  return (
    <ol className="mt-6 flex flex-col gap-2">
      {members.map((m, idx) => {
        const isCurrent = m.user_id === currentUserId;
        const isTop3 = m.rank <= 3;
        const isTop10 = m.rank <= 10;
        const isBottom5 = showDemoteZone && m.rank > members.length - 5;

        const showPromoDivider = m.rank === 11;
        const showDemoDivider =
          showDemoteZone && m.rank === members.length - 4;

        return (
          <div key={m.user_id}>
            {showPromoDivider && (
              <ZoneDivider tone="promo" label="Linha de promoção" />
            )}
            {showDemoDivider && (
              <ZoneDivider tone="demote" label="Linha de rebaixamento" />
            )}
            <li
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-3 transition-colors",
                isCurrent
                  ? "border-brand-green bg-brand-green/10"
                  : "border-border bg-surface",
                idx > 0 && "mt-2",
              )}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full font-display text-sm font-bold",
                  isTop3 && "bg-brand-yellow/20 text-brand-yellow",
                  !isTop3 && isTop10 && "bg-success/15 text-success",
                  isBottom5 && "bg-error/10 text-error",
                  !isTop10 && !isBottom5 && "bg-border text-text-muted",
                )}
              >
                {m.rank}
              </span>
              <span className="flex-1 truncate text-sm font-medium">
                {m.display_name}
                {isCurrent && <span className="ml-2 text-xs text-brand-green">você</span>}
              </span>
              <span className="flex items-center gap-1 text-sm">
                <Zap className="size-3.5 text-brand-yellow" />
                {m.weekly_xp.toLocaleString("pt-BR")}
              </span>
            </li>
          </div>
        );
      })}
    </ol>
  );
}

function ZoneDivider({ tone, label }: { tone: "promo" | "demote"; label: string }) {
  return (
    <div className="my-2 flex items-center gap-2">
      <div
        className={cn(
          "h-px flex-1",
          tone === "promo" ? "bg-success/40" : "bg-error/40",
        )}
      />
      <span
        className={cn(
          "text-[10px] uppercase tracking-wider",
          tone === "promo" ? "text-success" : "text-error",
        )}
      >
        {label}
      </span>
      <div
        className={cn(
          "h-px flex-1",
          tone === "promo" ? "bg-success/40" : "bg-error/40",
        )}
      />
    </div>
  );
}
