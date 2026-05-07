import { Suspense } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/logo";
import { Mascot } from "@/components/mascot";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Entrar",
};

export default function EntrarPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-10">
      <header className="flex items-center justify-between">
        <Link href="/">
          <Wordmark />
        </Link>
      </header>

      <section className="mt-10 flex flex-1 flex-col justify-center">
        <Mascot size={88} className="mb-4" />
        <h1 className="font-display text-3xl leading-tight font-bold tracking-tight">
          Entra ou cria conta.
        </h1>
        <p className="mt-2 text-text-muted">
          A gente manda um código no seu e-mail. Sem senha pra esquecer.
        </p>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </section>

      <footer className="mt-10 text-center text-xs text-text-muted">
        Ao entrar você concorda com os Termos e a Política de Privacidade.
      </footer>
    </main>
  );
}
