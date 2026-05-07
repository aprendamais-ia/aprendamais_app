export const TIER_ORDER = [
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
] as const;

export type Tier = (typeof TIER_ORDER)[number];

export const TIER_NAMES: Record<Tier, string> = {
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

export function nextTier(t: Tier): Tier {
  const i = TIER_ORDER.indexOf(t);
  return TIER_ORDER[Math.min(i + 1, TIER_ORDER.length - 1)];
}

export function prevTier(t: Tier): Tier {
  const i = TIER_ORDER.indexOf(t);
  return TIER_ORDER[Math.max(i - 1, 0)];
}
