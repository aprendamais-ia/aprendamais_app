import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Wordmark } from "@/components/logo";
import { OnboardingForm } from "./onboarding-form";

export const metadata = {
  title: "Vamos te conhecer",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at, primary_track_id")
    .eq("id", user.id)
    .single();

  if (profile?.onboarded_at) redirect("/app");

  const { data: tracks } = await supabase
    .from("tracks")
    .select("id, slug, name, issuer, exam_format")
    .eq("active", true)
    .order("name");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
      <header>
        <Wordmark />
      </header>
      <OnboardingForm tracks={tracks ?? []} />
    </main>
  );
}
