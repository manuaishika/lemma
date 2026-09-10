import Link from "next/link";
import type { Capture } from "@lemma/shared";
import { createClient } from "@/lib/supabase/server";
import { CaptureCard } from "@/components/CaptureCard";

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

  const { count: dueCount } = await supabase
    .from("srs_cards")
    .select("id", { count: "exact", head: true })
    .lte("due_at", new Date().toISOString());

  const qs = space ? `?space=${space}` : "";

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="font-serif text-3xl text-ink">{space ? "Space" : "Vault"}</h1>
        {dueCount ? (
          <Link href="/app/review" className="text-sm text-accent underline underline-offset-4">
            {dueCount} due for review
          </Link>
        ) : null}
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
            <CaptureCard key={capture.id} capture={capture} href={`/app/capture/${capture.id}${qs}`} />
          ))
        )}
      </div>
    </div>
  );
}
