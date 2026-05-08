"use client";

import { useEffect } from "react";
import { playPromote, playTierUp, playDemote } from "@/lib/sounds";
import type { LeagueTier, Division } from "@/components/league-badge";

const TIER_ORDER: LeagueTier[] = [
  "bronze",
  "prata",
  "ouro",
  "safira",
  "rubi",
  "esmeralda",
  "ametista",
  "perola",
  "diamante",
  "lendas",
];

function rank(tier: LeagueTier, division: Division): number {
  return TIER_ORDER.indexOf(tier) * 3 + (division - 1);
}

const STORAGE_KEY = "league:lastSeen";

type Snapshot = { tier: LeagueTier; division: Division };

type Props = {
  tier: LeagueTier;
  division: Division;
};

// Toca som apropriado quando o tier/divisão muda entre sessões. Comparação é
// feita contra o último snapshot salvo em localStorage. Sem snapshot prévio,
// só registra o atual e fica em silêncio.
export function LeagueChangeChime({ tier, division }: Props) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const current: Snapshot = { tier, division };
    let last: Snapshot | null = null;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) last = JSON.parse(raw) as Snapshot;
    } catch {
      // localStorage inacessível ou JSON corrompido — trata como sem snapshot
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // no-op
    }

    if (!last) return;
    if (last.tier === current.tier && last.division === current.division) return;

    const oldRank = rank(last.tier, last.division);
    const newRank = rank(current.tier, current.division);

    if (newRank > oldRank) {
      // Subiu. Se mudou de metal: WOW épico. Se foi só divisão: ding curtinho.
      if (last.tier !== current.tier) {
        playTierUp();
      } else {
        playPromote();
      }
    } else if (newRank < oldRank) {
      playDemote();
    }
  }, [tier, division]);

  return null;
}
