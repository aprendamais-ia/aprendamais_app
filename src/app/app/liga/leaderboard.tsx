"use client";

import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type Row = {
  user_id: string;
  display_name: string;
  weekly_xp: number;
  rank: number;
};

type Props = {
  currentUserId: string;
  rows: Row[];
  ghostRow: Row | null;
};

export function Leaderboard({ currentUserId, rows, ghostRow }: Props) {
  if (rows.length === 0 && !ghostRow) {
    return (
      <ol className="mt-6">
        <li className="rounded-2xl bg-surface p-5 text-center text-sm text-text-muted">
          Você é o primeiro da semana. Manda lição pra subir XP.
        </li>
      </ol>
    );
  }

  if (rows.length === 0 && ghostRow) {
    return (
      <ol className="mt-6 flex flex-col gap-2">
        <li className="rounded-2xl border border-dashed border-border bg-surface p-5 text-center text-sm text-text-muted">
          Ninguém pontuou ainda. Seja o primeiro.
        </li>
        <RankRow row={ghostRow} isCurrent placeholder />
      </ol>
    );
  }

  return (
    <ol className="mt-6 flex flex-col gap-2">
      {rows.map((r) => (
        <RankRow key={r.user_id} row={r} isCurrent={r.user_id === currentUserId} />
      ))}
      {ghostRow && (
        <>
          <DividerNote>
            Você ainda não pontuou esta semana
          </DividerNote>
          <RankRow row={ghostRow} isCurrent placeholder />
        </>
      )}
    </ol>
  );
}

function RankRow({
  row,
  isCurrent,
  placeholder = false,
}: {
  row: Row;
  isCurrent: boolean;
  placeholder?: boolean;
}) {
  const isTop3 = row.rank <= 3 && !placeholder;

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-3 transition-colors",
        isCurrent
          ? "border-brand-green bg-brand-green/10"
          : "border-border bg-surface",
        placeholder && "border-dashed",
      )}
    >
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-full font-display text-sm font-bold",
          isTop3 ? "bg-brand-yellow/20 text-brand-yellow" : "bg-border text-text-muted",
        )}
      >
        {placeholder ? "—" : row.rank}
      </span>
      <span className="flex-1 truncate text-sm font-medium">
        {row.display_name}
        {isCurrent && <span className="ml-2 text-xs text-brand-green">você</span>}
      </span>
      <span className="flex items-center gap-1 text-sm tabular-nums">
        <Zap className="size-3.5 text-brand-yellow" />
        {row.weekly_xp.toLocaleString("pt-BR")}
      </span>
    </li>
  );
}

function DividerNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-1 flex items-center gap-2">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[10px] uppercase tracking-wider text-text-muted">
        {children}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
