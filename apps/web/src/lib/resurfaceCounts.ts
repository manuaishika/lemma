import type { SupabaseClient } from "@supabase/supabase-js";
import { effectiveResurface, type Capture } from "@lemma/shared";

/** Captures whose reminder time has come, restricted to your own and to "revisit" ones. */
export async function dueRevisits(supabase: SupabaseClient, userId: string, limit = 200): Promise<Capture[]> {
  const { data } = await supabase
    .from("captures")
    .select("*")
    .eq("user_id", userId)
    .lte("remind_at", new Date().toISOString())
    .order("remind_at", { ascending: true })
    .limit(limit * 2);
  return ((data ?? []) as Capture[]).filter((c) => effectiveResurface(c) === "revisit").slice(0, limit);
}

/** How many graded reviews and how many gentle reminders are waiting for you. */
export async function resurfaceCounts(supabase: SupabaseClient): Promise<{ review: number; revisit: number }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { review: 0, revisit: 0 };

  const { data: cards } = await supabase
    .from("srs_cards")
    .select("id, capture:captures(*)")
    .lte("due_at", new Date().toISOString())
    .limit(300);

  const review = ((cards ?? []) as unknown as Array<{ capture: Capture | null }>).filter(
    (row) => row.capture && effectiveResurface(row.capture) === "review",
  ).length;

  const revisit = (await dueRevisits(supabase, user.id)).length;
  return { review, revisit };
}
