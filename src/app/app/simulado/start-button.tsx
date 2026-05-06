"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createSimulado } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  sem_sessao: "Sessão expirou. Entra de novo.",
  sem_trilha: "Define uma trilha primeiro no onboarding.",
  sem_questoes: "Sem questões publicadas pra essa trilha. Roda `pnpm db:seed-demo` ou gera mais.",
  trilha_invalida: "Trilha inválida.",
  sem_topicos: "Tópicos não foram seedados. Roda `pnpm db:seed-topics`.",
  falha_criar: "Não rolou criar o simulado. Tenta de novo.",
};

export function StartSimuladoButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleClick() {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await createSimulado();
      if ("error" in res) {
        setErrorMsg((res.error ? ERROR_MESSAGES[res.error] : null) ?? "Algo travou. Tenta de novo.");
        return;
      }
      router.push(`/app/simulado/${res.simuladoId}`);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={cn(
          "mt-5 flex h-14 w-full items-center justify-center rounded-2xl bg-brand-green font-display text-lg font-semibold text-brand-green-fg shadow-sm transition-transform active:scale-[0.98]",
          "disabled:opacity-60",
        )}
      >
        {pending ? "Preparando..." : "Começar simulado"}
      </button>
      {errorMsg && <p className="mt-3 text-sm text-error">{errorMsg}</p>}
    </>
  );
}
