import Link from "next/link";
import { Flame, Zap, Trophy } from "lucide-react";
import { Wordmark } from "@/components/logo";
import { Mascot } from "@/components/mascot";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-10">
      <header className="flex items-center justify-between">
        <Wordmark />
        <Link
          href="/entrar"
          className="text-sm font-medium text-text-muted hover:text-text"
        >
          Entrar
        </Link>
      </header>

      <section className="mt-12 flex flex-1 flex-col justify-center">
        <Mascot size={140} className="mx-auto mb-6" />
        <h1 className="font-display text-4xl leading-tight font-bold tracking-tight">
          O jeito mais leve
          <br />
          de passar no <span className="text-brand-green">concurso</span>.
        </h1>
        <p className="mt-4 text-text-muted">
          5 minutos por dia. CPA-10 ou OAB. Sem videoaula chata, sem PDF
          gigante. Só você, suas metas e a sua chance de aprovação subindo.
        </p>

        <div className="mt-10 grid grid-cols-3 gap-3 text-center">
          <Stat icon={<Flame className="size-5 text-streak" />} label="Streak" value="🔥" />
          <Stat icon={<Zap className="size-5 text-brand-yellow" />} label="XP" value="+10" />
          <Stat icon={<Trophy className="size-5 text-premium" />} label="Liga" value="Ouro" />
        </div>

        <Link
          href="/entrar"
          className="btn-squash mt-12 flex h-14 items-center justify-center rounded-2xl bg-brand-green font-display text-lg font-semibold text-brand-green-fg shadow-sm"
        >
          Bora começar
        </Link>
        <p className="mt-3 text-center text-xs text-text-muted">
          Grátis pra começar · Pix ou cartão · Cancela quando quiser
        </p>
      </section>

      <footer className="mt-10 text-center text-xs text-text-muted">
        🚧 Em construção · Beta privado em breve
      </footer>
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-surface p-3">
      <div className="flex items-center justify-center">{icon}</div>
      <div className="mt-1 font-display font-bold">{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  );
}
