"use client";

import { useEffect, useState } from "react";

function nextMondayBrtMs(now: Date): number {
  // Calcula a próxima segunda-feira 00:00 em America/Sao_Paulo (UTC-3, sem DST).
  // Usamos UTC offsets fixos: BRT = UTC-3.
  const utcMs = now.getTime();
  const brtNow = new Date(utcMs - 3 * 60 * 60 * 1000);
  const dow = brtNow.getUTCDay(); // 0=dom, 1=seg, ..., 6=sáb
  // Dias até a próxima segunda — se hoje for segunda mas já passou de 00:00, ainda assim o "fechamento da semana corrente" é segunda que vem
  const daysUntilMon = ((1 - dow + 7) % 7) || 7;
  const nextMonBrt = new Date(
    Date.UTC(
      brtNow.getUTCFullYear(),
      brtNow.getUTCMonth(),
      brtNow.getUTCDate() + daysUntilMon,
      0,
      0,
      0,
      0,
    ),
  );
  // Volta de BRT pra UTC: BRT + 3h = UTC
  return nextMonBrt.getTime() + 3 * 60 * 60 * 1000;
}

function format(ms: number, prefix = "Fecha em "): string {
  if (ms <= 0) return "fechando agora";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (days >= 1) return `${prefix}${days}d ${hours}h`;
  if (hours >= 1) return `${prefix}${hours}h ${minutes}min`;
  const seconds = totalSec % 60;
  return `${prefix}${minutes}min ${String(seconds).padStart(2, "0")}s`;
}

export function LeagueCountdown({ inline = false }: { inline?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!now) {
    if (inline) return <span>Reset toda segunda 00:00.</span>;
    return <p className="mt-1 text-sm text-text-muted">Reset toda segunda 00:00</p>;
  }

  const remaining = nextMondayBrtMs(now) - now.getTime();
  const text = format(remaining, inline ? "Fecha em " : "Fecha em ");

  if (inline) return <span>{text}.</span>;
  return <p className="mt-1 text-sm text-text-muted">{text}</p>;
}
