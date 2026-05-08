"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { ArrowDown, ArrowUp, Sparkles } from "lucide-react";
import { playPromote, playTierUp, playDemote } from "@/lib/sounds";
import { LeagueBadge, type LeagueTier, type Division } from "@/components/league-badge";
import { Confetti } from "@/components/confetti";
import { cn } from "@/lib/utils";

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

const TIER_LABEL: Record<LeagueTier, string> = {
  bronze: "Bronze",
  prata: "Prata",
  ouro: "Ouro",
  safira: "Safira",
  rubi: "Rubi",
  esmeralda: "Esmeralda",
  ametista: "Ametista",
  perola: "Pérola",
  diamante: "Diamante",
  lendas: "Lendas",
};

function rank(tier: LeagueTier, division: Division): number {
  return TIER_ORDER.indexOf(tier) * 3 + (division - 1);
}

const STORAGE_KEY = "league:lastSeen";

type Snapshot = { tier: LeagueTier; division: Division };
type Kind = "promote" | "tierUp" | "demote";
type Event = { from: Snapshot; to: Snapshot; kind: Kind };

type Props = {
  tier: LeagueTier;
  division: Division;
};

const DURATION_MS: Record<Kind, number> = {
  tierUp: 3600,
  promote: 2400,
  demote: 1900,
};

// Detecta mudança de tier/divisão entre sessões e dispara celebração visual +
// som apropriado. Snapshot fica em localStorage. Sem snapshot prévio, registra
// e fica em silêncio (login novo, primeira visita).
export function LeagueChangeCelebration({ tier, division }: Props) {
  const [event, setEvent] = useState<Event | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const current: Snapshot = { tier, division };
    let last: Snapshot | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) last = JSON.parse(raw) as Snapshot;
    } catch {
      // localStorage corrompido ou inacessível — trata como sem snapshot
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

    let kind: Kind;
    if (newRank > oldRank) {
      kind = last.tier !== current.tier ? "tierUp" : "promote";
    } else if (newRank < oldRank) {
      kind = "demote";
    } else {
      return;
    }

    setEvent({ from: last, to: current, kind });

    if (kind === "tierUp") playTierUp();
    else if (kind === "promote") playPromote();
    else playDemote();

    const t = setTimeout(() => setDismissed(true), DURATION_MS[kind]);
    return () => clearTimeout(t);
  }, [tier, division]);

  if (!event || dismissed) return null;

  return (
    <button
      type="button"
      onClick={() => setDismissed(true)}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 px-6 backdrop-blur-sm animate-pop-in"
      aria-label="Fechar celebração"
    >
      {event.kind === "tierUp" && <TierUpStage event={event} />}
      {event.kind === "promote" && <PromoteStage event={event} />}
      {event.kind === "demote" && <DemoteStage event={event} />}

      <p className="absolute bottom-10 text-[11px] uppercase tracking-widest text-white/50">
        toca pra fechar
      </p>
    </button>
  );
}

// ----- TIER UP — momento WOW -------------------------------------------------
function TierUpStage({ event }: { event: Event }) {
  return (
    <>
      <Confetti />

      <div className="flex flex-col items-center text-center">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-brand-yellow animate-label-rise">
          Mudança de liga
        </p>

        <div className="relative mt-8">
          {/* glow ring atrás do badge */}
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-56 rounded-full animate-glow-pulse"
            style={{
              background:
                "radial-gradient(circle, rgba(253,224,71,0.55) 0%, rgba(253,224,71,0) 65%)",
            }}
          />
          {/* anel rotativo de raios */}
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-48 animate-ring-spin"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.4) 20deg, transparent 40deg, transparent 90deg, rgba(255,255,255,0.4) 110deg, transparent 130deg, transparent 180deg, rgba(255,255,255,0.4) 200deg, transparent 220deg, transparent 270deg, rgba(255,255,255,0.4) 290deg, transparent 310deg)",
              maskImage:
                "radial-gradient(circle, transparent 42%, black 45%, black 100%)",
              WebkitMaskImage:
                "radial-gradient(circle, transparent 42%, black 45%, black 100%)",
            }}
          />
          <div className="relative animate-badge-burst">
            <LeagueBadge tier={event.to.tier} division={event.to.division} size="lg" showLabel={false} />
          </div>
        </div>

        <h2 className="mt-8 font-display text-4xl font-bold text-white animate-label-rise">
          Liga {TIER_LABEL[event.to.tier]}!
        </h2>
        <p
          className="mt-2 flex items-center gap-2 text-sm text-white/70 animate-label-rise"
          style={{ animationDelay: "400ms" } as CSSProperties}
        >
          <ArrowUp className="size-4 text-success" />
          {TIER_LABEL[event.from.tier]} {roman(event.from.division)} → {TIER_LABEL[event.to.tier]} {roman(event.to.division)}
        </p>
      </div>
    </>
  );
}

// ----- PROMOTE — promoção de divisão (mesmo metal) --------------------------
function PromoteStage({ event }: { event: Event }) {
  return (
    <div className="flex flex-col items-center text-center">
      <p
        className="font-display text-xs uppercase tracking-[0.3em] text-brand-yellow animate-label-rise"
      >
        Promoção
      </p>

      <div className="relative mt-6">
        {/* glow suave */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-44 rounded-full animate-glow-pulse"
          style={{
            background:
              "radial-gradient(circle, rgba(34,197,94,0.45) 0%, rgba(34,197,94,0) 65%)",
          }}
        />
        {/* sparkles em volta */}
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <Sparkle key={i} angle={deg} delay={i * 80} />
        ))}
        <div className="relative animate-badge-burst">
          <LeagueBadge tier={event.to.tier} division={event.to.division} size="lg" showLabel={false} />
        </div>
      </div>

      <h2 className="mt-8 font-display text-2xl font-bold text-white animate-label-rise">
        {TIER_LABEL[event.to.tier]} {roman(event.to.division)}
      </h2>
      <p
        className="mt-1 flex items-center gap-2 text-sm text-white/70 animate-label-rise"
        style={{ animationDelay: "320ms" } as CSSProperties}
      >
        <ArrowUp className="size-4 text-success" /> +1 divisão
      </p>
    </div>
  );
}

// ----- DEMOTE — rebaixamento (sutil, não punitivo) --------------------------
function DemoteStage({ event }: { event: Event }) {
  return (
    <div className="flex flex-col items-center text-center">
      <p className="font-display text-xs uppercase tracking-[0.3em] text-white/50 animate-label-rise">
        Rebaixamento
      </p>

      <div className="relative mt-6">
        <div
          className={cn(
            "relative",
            // shake leve + transição mais suave que promote
            "animate-shake-x",
          )}
        >
          <LeagueBadge tier={event.to.tier} division={event.to.division} size="lg" showLabel={false} />
        </div>
      </div>

      <h2
        className="mt-8 font-display text-2xl font-bold text-white animate-label-rise"
        style={{ animationDelay: "180ms" } as CSSProperties}
      >
        {TIER_LABEL[event.to.tier]} {roman(event.to.division)}
      </h2>
      <p
        className="mt-1 flex items-center gap-2 text-sm text-white/60 animate-label-rise"
        style={{ animationDelay: "360ms" } as CSSProperties}
      >
        <ArrowDown className="size-4 text-error" />
        −1 divisão · vamo de volta
      </p>
    </div>
  );
}

// ----- helpers ---------------------------------------------------------------
function Sparkle({ angle, delay }: { angle: number; delay: number }) {
  // Spark sai do centro do badge na direção `angle` (graus, 0 = pra cima)
  const rad = (angle - 90) * (Math.PI / 180);
  const dist = 90;
  const sx = `${Math.cos(rad) * dist}px`;
  const sy = `${Math.sin(rad) * dist}px`;
  return (
    <span
      aria-hidden
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spark-out"
      style={
        {
          "--sx": sx,
          "--sy": sy,
          animationDelay: `${delay}ms`,
        } as CSSProperties & { "--sx": string; "--sy": string }
      }
    >
      <Sparkles className="size-4 text-brand-yellow drop-shadow" />
    </span>
  );
}

function roman(d: Division): string {
  return d === 1 ? "I" : d === 2 ? "II" : "III";
}
