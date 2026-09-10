import type { Capture, DueCard, SrsCard } from "@lemma/shared";
import { createClient } from "@/lib/supabase/server";
import { ReviewSession } from "@/components/ReviewSession";

export const dynamic = "force-dynamic";

type Row = SrsCard & { capture: Capture | null };

export default async function ReviewPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("srs_cards")
    .select("*, capture:captures(*)")
    .lte("due_at", new Date().toISOString())
    .order("due_at", { ascending: true })
    .limit(50);

  const due: DueCard[] = ((data ?? []) as Row[])
    .filter((row): row is Row & { capture: Capture } => row.capture !== null)
    .map(({ capture, ...card }) => ({ card, capture }));

  return <ReviewSession initial={due} />;
}
