import { cn } from "@/lib/utils";

export type LeagueTier =
  | "bronze"
  | "prata"
  | "ouro"
  | "safira"
  | "rubi"
  | "esmeralda"
  | "ametista"
  | "perola"
  | "diamante"
  | "lendas";

export type Division = 1 | 2 | 3;

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

// Cores escolhidas pra evocar o metal/pedra sem ficar literal demais.
// Cada tier tem dois stops pra dar volume com gradient radial.
const TIER_GRADIENT: Record<LeagueTier, { from: string; to: string; ring: string }> = {
  bronze:    { from: "#e2a876", to: "#8a4f1f", ring: "#cd7f32" },
  prata:     { from: "#f4f4f5", to: "#71717a", ring: "#a1a1aa" },
  ouro:      { from: "#fde68a", to: "#b45309", ring: "#f59e0b" },
  safira:    { from: "#7dd3fc", to: "#1e3a8a", ring: "#3b82f6" },
  rubi:      { from: "#fda4af", to: "#9f1239", ring: "#e11d48" },
  esmeralda: { from: "#86efac", to: "#065f46", ring: "#10b981" },
  ametista:  { from: "#d8b4fe", to: "#581c87", ring: "#a855f7" },
  perola:    { from: "#ffffff", to: "#cbd5e1", ring: "#e2e8f0" },
  diamante:  { from: "#cffafe", to: "#0e7490", ring: "#22d3ee" },
  lendas:    { from: "#fde68a", to: "#7c3aed", ring: "#f59e0b" },
};

const ROMAN: Record<Division, string> = { 1: "I", 2: "II", 3: "III" };

type Props = {
  tier: LeagueTier;
  division: Division;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
};

export function LeagueBadge({
  tier,
  division,
  size = "md",
  showLabel = true,
  className,
}: Props) {
  const colors = TIER_GRADIENT[tier];
  const sizes = {
    sm: { box: "size-12", roman: "text-base", label: "text-xs" },
    md: { box: "size-20", roman: "text-2xl", label: "text-sm" },
    lg: { box: "size-28", roman: "text-3xl", label: "text-base" },
  }[size];

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full",
          "shadow-[inset_0_-6px_12px_rgba(0,0,0,0.25),inset_0_4px_8px_rgba(255,255,255,0.35),0_4px_16px_rgba(0,0,0,0.15)]",
          sizes.box,
        )}
        style={{
          background: `radial-gradient(circle at 30% 25%, ${colors.from}, ${colors.to})`,
          boxShadow: `0 0 0 3px ${colors.ring}, inset 0 -6px 12px rgba(0,0,0,0.25), inset 0 4px 8px rgba(255,255,255,0.35), 0 4px 16px rgba(0,0,0,0.15)`,
        }}
        aria-label={`${TIER_LABEL[tier]} ${ROMAN[division]}`}
      >
        <span
          className={cn(
            "font-display font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]",
            sizes.roman,
          )}
          style={{
            color: tier === "perola" || tier === "ouro" ? "#1a1400" : "#ffffff",
          }}
        >
          {ROMAN[division]}
        </span>
      </div>
      {showLabel && (
        <div className="text-center">
          <p className={cn("font-display font-bold leading-tight", sizes.label)}>
            {TIER_LABEL[tier]} {ROMAN[division]}
          </p>
        </div>
      )}
    </div>
  );
}
