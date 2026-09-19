import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InviteForm } from "@/components/InviteForm";

export const dynamic = "force-dynamic";

interface MemberRow {
  user_id: string;
  role: "owner" | "member";
  profile: { email: string | null; display_name: string | null } | null;
}

export default async function SpaceSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: space } = await supabase.from("spaces").select("*").eq("id", id).single();
  if (!space) notFound();

  const { data: members } = await supabase
    .from("space_members")
    .select("user_id, role, profile:profiles(email, display_name)")
    .eq("space_id", id);

  const { data: invites } = await supabase.from("space_invites").select("id, email").eq("space_id", id);

  return (
    <div>
      <Link href={`/app?space=${id}`} className="text-sm text-ink-soft underline underline-offset-4">
        ← Back to {space.name}
      </Link>
      <h1 className="mt-5 font-serif text-3xl text-ink">{space.name}</h1>

      <section className="mt-8">
        <h2 className="text-xs uppercase tracking-wide text-ink-faint">Members</h2>
        <ul className="mt-3 space-y-1 text-sm text-ink-soft">
          {((members as MemberRow[] | null) ?? []).map((m) => (
            <li key={m.user_id}>
              {m.profile?.email ?? m.user_id} {m.role === "owner" && <span className="text-ink-faint">(owner)</span>}
            </li>
          ))}
          {(invites ?? []).map((i) => (
            <li key={i.id}>
              {i.email} <span className="text-ink-faint">(invited — hasn&apos;t signed up yet)</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xs uppercase tracking-wide text-ink-faint">Invite</h2>
        <p className="mt-1 text-sm text-ink-faint">
          Invite anyone by email. If they don't have an account yet, the invite waits for them.
        </p>
        <div className="mt-3">
          <InviteForm spaceId={id} />
        </div>
      </section>
    </div>
  );
}
