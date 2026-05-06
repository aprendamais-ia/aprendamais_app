import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Entrar",
};

export default function EntrarPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="font-display text-xl font-bold">
          Aprenda Mais
        </Link>
      </header>

      <section className="mt-16 flex flex-1 flex-col justify-center">
        <h1 className="font-display text-3xl leading-tight font-bold tracking-tight">
          Entra ou cria conta.
        </h1>
        <p className="mt-2 text-text-muted">
          A gente manda um código no teu e-mail. Sem senha pra esquecer.
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
