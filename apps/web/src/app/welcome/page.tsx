import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Onboarding } from "@/components/Onboarding";

export const dynamic = "force-dynamic";

export const metadata = { title: "Lemma — try it" };

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/app");

  return <Onboarding />;
}
