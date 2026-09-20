import Link from "next/link";
import type { Capture } from "@lemma/shared";
import { createClient } from "@/lib/supabase/server";
import { CaptureCard } from "@/components/CaptureCard";
import { resurfaceCounts } from "@/lib/resurfaceCounts";

export const dynamic = "force-dynamic";

export default async function VaultPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; space?: string }>;
}) {
  const { q, space } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("captures").select("*").order("created_at", { ascending: false }).limit(100);
  query = space ? query.eq("space_id", space) : query.is("space_id", null);
  const term = q?.trim().replace(/[,()\\*]/g, " ").trim();
  if (term) {
    query = query.or(`text.ilike.%${term}%,user_note.ilike.%${term}%,explanation.ilike.%${term}%`);
  }
  const { data: captures } = await query;

  // In a space, say who added each capture (by name, not id).
  let spaceName = "Space";
  const sharedBy: Record<string, string> = {};
  if (space) {
    const { data: sp } = await supabase.from("spaces").select("name").eq("id", space).single();
    spaceName = sp?.name ?? "Space";
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const ids = [...new Set(((captures as Capture[] | null) ?? []).map((c) => c.user_id))];
    if (ids.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("id, display_name, email").in("id", ids);
      for (const p of profs ?? []) {
        sharedBy[p.id] = p.id === user?.id ? "you" : p.display_name || p.email || "a member";
      }
    }
  }

  const { review: dueCount, revisit: revisitCount } = await resurfaceCounts(supabase);

  const qs = space ? `?space=${space}` : "";

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="font-serif text-3xl text-ink">{space ? spaceName : "Vault"}</h1>
        <div className="flex items-baseline gap-5">
          {dueCount ? (
            <Link href="/app/review" className="text-sm text-accent underline underline-offset-4">
              {dueCount} due for review
            </Link>
          ) : null}
          {revisitCount ? (
            <Link href="/app/revisit" className="text-sm text-accent underline underline-offset-4">
              {revisitCount} to revisit
            </Link>
          ) : null}
        </div>
      </div>

      <form className="mt-6">
        {space && <input type="hidden" name="space" value={space} />}
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search captures and notes…"
          className="w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </form>

      <div className="mt-4">
        {!captures || captures.length === 0 ? (
          <p className="mt-10 text-sm text-ink-faint">
            {q
              ? "Nothing matches that search."
              : "Nothing saved here yet. Install the extension, then highlight a word, save a screenshot, or save a link — right-click anywhere."}
          </p>
        ) : (
          (captures as Capture[]).map((capture) => (
            <CaptureCard
              key={capture.id}
              capture={capture}
              href={`/app/capture/${capture.id}${qs}`}
              sharedBy={space ? sharedBy[capture.user_id] ?? "a member" : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
