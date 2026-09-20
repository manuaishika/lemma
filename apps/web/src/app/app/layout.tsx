import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Space } from "@lemma/shared";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";
import { SpaceSwitcher } from "@/components/SpaceSwitcher";
import { PendingCaptureSync } from "@/components/PendingCaptureSync";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: spaces } = await supabase.from("spaces").select("*").order("name");
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();
  const name = profile?.display_name || (user.email ? user.email.split("@")[0] : "");

  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-reading items-center justify-between px-6 py-4">
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/app" className="font-serif text-base italic text-ink">
              Lemma
            </Link>
            <Link href="/app" className="text-ink-soft hover:text-ink">
              Vault
            </Link>
            <Link href="/app/review" className="text-ink-soft hover:text-ink">
              Review
            </Link>
            <Link href="/app/revisit" className="text-ink-soft hover:text-ink">
              Revisit
            </Link>
            <Suspense fallback={null}>
              <SpaceSwitcher spaces={(spaces as Space[]) ?? []} />
            </Suspense>
          </nav>
          <div className="flex items-center gap-4">
            {name && <span className="hidden text-sm text-ink-soft sm:inline">Hi, {name}</span>}
            <SignOutButton />
          </div>
        </div>
      </header>
      <PendingCaptureSync />
      <div className="mx-auto max-w-reading px-6 py-10">{children}</div>
    </div>
  );
}
