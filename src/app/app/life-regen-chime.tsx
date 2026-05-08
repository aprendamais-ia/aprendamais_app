"use client";

import { useEffect, useRef } from "react";
import { playLifeRegen } from "@/lib/sounds";

type Props = {
  livesAdded: number;
};

// Toca playLifeRegen se o claim_lives() do server snapshotou regeneração.
// Idempotente por useRef: se o componente re-renderiza no mesmo mount, não
// toca de novo.
export function LifeRegenChime({ livesAdded }: Props) {
  const playedRef = useRef(false);

  useEffect(() => {
    if (playedRef.current) return;
    if (livesAdded <= 0) return;
    playedRef.current = true;
    playLifeRegen();
  }, [livesAdded]);

  return null;
}
