"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Step = "email" | "code";
type Status = "idle" | "sending" | "verifying" | "error";

const CODE_LENGTH = 6;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/app";

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function sendCode(targetEmail: string) {
    setStatus("sending");
    setErrorMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: { shouldCreateUser: true },
    });
    if (error) {
      setStatus("error");
      setErrorMsg("Não rolou enviar o código. Confere o e-mail e tenta de novo.");
      return false;
    }
    setStatus("idle");
    return true;
  }

  async function onSubmitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === "sending") return;
    const ok = await sendCode(email);
    if (ok) {
      setCode("");
      setStep("code");
    }
  }

  async function onSubmitCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== CODE_LENGTH || status === "verifying") return;
    setStatus("verifying");
    setErrorMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    if (error) {
      setStatus("error");
      setErrorMsg("Código inválido ou expirado. Tenta de novo.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  if (step === "code") {
    return (
      <form onSubmit={onSubmitCode} className="mt-8 flex flex-col gap-4">
        <div>
          <p className="font-display text-lg font-semibold">Confere o e-mail.</p>
          <p className="mt-1 text-sm text-text-muted">
            Mandamos um código de {CODE_LENGTH} dígitos pra <span className="font-medium text-text">{email}</span>.
          </p>
        </div>

        <OtpInput value={code} onChange={setCode} length={CODE_LENGTH} />

        <button
          type="submit"
          disabled={code.length !== CODE_LENGTH || status === "verifying"}
          className={cn(
            "mt-2 flex h-14 items-center justify-center rounded-2xl font-display text-lg font-semibold shadow-sm transition-transform active:scale-[0.98]",
            "bg-brand-green text-brand-green-fg disabled:opacity-60",
          )}
        >
          {status === "verifying" ? "Verificando..." : "Entrar"}
        </button>

        {errorMsg && <p className="text-sm text-error">{errorMsg}</p>}

        <div className="mt-2 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setErrorMsg(null);
              setStatus("idle");
            }}
            className="text-text-muted underline"
          >
            Trocar e-mail
          </button>
          <button
            type="button"
            onClick={() => sendCode(email)}
            disabled={status === "sending"}
            className="font-medium text-brand-green underline disabled:opacity-60"
          >
            {status === "sending" ? "Enviando..." : "Reenviar código"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmitEmail} className="mt-8 flex flex-col gap-3">
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
        {status === "sending" ? "Enviando..." : "Receber código"}
      </button>

      {errorMsg && <p className="mt-2 text-sm text-error">{errorMsg}</p>}
    </form>
  );
}

function OtpInput({
  value,
  onChange,
  length,
}: {
  value: string;
  onChange: (v: string) => void;
  length: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, length);
    onChange(digits);
  }

  return (
    <div
      className="relative"
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={length}
        value={value}
        onChange={handleChange}
        className="absolute inset-0 h-full w-full opacity-0"
        aria-label="Código de verificação"
      />
      <div className="flex justify-between gap-2">
        {Array.from({ length }).map((_, i) => {
          const char = value[i] ?? "";
          const isActive = i === value.length;
          return (
            <div
              key={i}
              className={cn(
                "relative flex h-14 flex-1 items-center justify-center rounded-xl border text-center font-display text-2xl font-bold transition-colors",
                char
                  ? "border-brand-green bg-brand-green/5"
                  : isActive
                    ? "border-brand-green/60 bg-surface-elevated"
                    : "border-input bg-surface-elevated",
              )}
            >
              {char}
              {isActive && !char && (
                <span
                  aria-hidden="true"
                  className="block h-7 w-0.5 bg-text"
                  style={{ animation: "caret-blink 1s step-end infinite" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
