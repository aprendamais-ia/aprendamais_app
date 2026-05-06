import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Flame, Zap, Heart } from "lucide-react";
import { SignOutButton } from "./sign-out-button";

export const metadata = {
  title: "Início",
};

export default async function AppHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // middleware já protege, mas redundância barata
    redirect("/entrar");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, xp_total, lives, streak_days")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
      <header className="flex items-center justify-between">
        <span className="font-display text-xl font-bold">Aprenda Mais</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1">
            <Heart className="size-4 text-error" />
            {profile?.lives ?? 5}
          </span>
          <span className="flex items-center gap-1">
            <Flame className="size-4 text-streak" />
            {profile?.streak_days ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <Zap className="size-4 text-brand-yellow" />
            {profile?.xp_total ?? 0}
          </span>
        </div>
      </header>

      <section className="mt-12 flex flex-1 flex-col">
        <h1 className="font-display text-3xl font-bold">
          Oi, {profile?.display_name ?? user.email}.
        </h1>
        <p className="mt-2 text-text-muted">
          Tu está logado. Onboarding e player de lição vêm a seguir (E1 + E2).
        </p>

        <div className="mt-8 rounded-2xl bg-surface p-5">
          <p className="text-sm font-medium">Próximos passos</p>
          <ul className="mt-3 space-y-2 text-sm text-text-muted">
            <li>• Onboarding: escolher trilha + meta diária</li>
            <li>• Teste de nível inicial (10 questões)</li>
            <li>• Primeira lição</li>
          </ul>
        </div>
      </section>

      <SignOutButton />
    </main>
  );
}
