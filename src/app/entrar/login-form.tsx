"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Status = "idle" | "sending" | "sent" | "error";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/app";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === "sending") return;
    setStatus("sending");
    setErrorMsg(null);

    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg("Não rolou enviar o link. Confere o e-mail e tenta de novo.");
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="mt-8 rounded-2xl bg-surface p-6 text-center">
        <p className="font-display text-lg font-semibold">Link enviado.</p>
        <p className="mt-2 text-sm text-text-muted">
          Abre teu e-mail ({email}) e clica no link pra entrar.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm font-medium text-brand-green underline"
        >
          Trocar e-mail
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">E-mail</span>
        <input
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="voce@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-xl border border-input bg-surface-elevated px-4 outline-none transition-colors focus:border-brand-green focus:ring-2 focus:ring-brand-green/30"
        />
      </label>

      <button
        type="submit"
        disabled={status === "sending"}
        className={cn(
          "mt-2 flex h-14 items-center justify-center rounded-2xl font-display text-lg font-semibold shadow-sm transition-transform active:scale-[0.98]",
          "bg-brand-green text-brand-green-fg disabled:opacity-60",
        )}
      >
        {status === "sending" ? "Enviando..." : "Mandar link de acesso"}
      </button>

      {errorMsg && <p className="mt-2 text-sm text-error">{errorMsg}</p>}
    </form>
  );
}
