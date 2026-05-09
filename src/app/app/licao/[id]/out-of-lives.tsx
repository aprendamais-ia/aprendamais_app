"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Mascot } from "@/components/mascot";

type Props = {
  livesRegenAt: string | null;
};

export function OutOfLives({ livesRegenAt }: Props) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const regenMs = livesRegenAt ? new Date(livesRegenAt).getTime() : null;
  const remainingMs = regenMs ? Math.max(0, regenMs - now) : 0;

  useEffect(() => {
    if (regenMs && remainingMs === 0) {
      router.refresh();
    }
  }, [regenMs, remainingMs, router]);

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
      <Link href="/app" className="flex items-center gap-1 text-sm text-text-muted">
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <section className="mt-12 flex flex-1 flex-col items-center text-center">
        <Mascot variant="sad" size={160} />
        <h1 className="mt-4 font-display text-3xl font-bold">Sem vidas.</h1>
        <p className="mt-3 text-text-muted">
          Errou demais por agora. Volta quando uma vida regenerar.
        </p>

        {regenMs !== null && remainingMs > 0 && (
          <div className="mt-8 rounded-2xl bg-surface px-6 py-5">
            <div className="text-xs uppercase tracking-wider text-text-muted">
              Próxima vida em
            </div>
            <div className="mt-1 font-mono text-4xl font-bold">
              {String(minutes).padStart(2, "0")}:
              {String(seconds).padStart(2, "0")}
            </div>
          </div>
        )}
      </section>

      <Link
        href="/app"
        className="btn-squash mt-8 flex h-14 items-center justify-center rounded-2xl bg-brand-green font-display text-lg font-semibold text-brand-green-fg shadow-sm"
      >
        Voltar pro início
      </Link>
    </main>
  );
}
