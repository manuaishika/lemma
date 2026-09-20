import Link from "next/link";
import { notFound } from "next/navigation";
import type { Capture, Space, SrsCard } from "@lemma/shared";
import { createClient } from "@/lib/supabase/server";
import { CaptureImage } from "@/components/CaptureImage";
import { NoteEditor } from "@/components/NoteEditor";
import { ReferenceLayers } from "@/components/ReferenceLayers";
import { SpacePicker } from "@/components/SpacePicker";
import { DeleteCaptureButton } from "@/components/DeleteCaptureButton";

export const dynamic = "force-dynamic";

export default async function CapturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: capture } = await supabase.from("captures").select("*").eq("id", id).single();
  if (!capture) notFound();
  const c = capture as Capture;

  const { data: spaces } = await supabase.from("spaces").select("*").order("name");

  const { data: card } = await supabase
    .from("srs_cards")
    .select("*")
    .eq("capture_id", id)
    .single<SrsCard>();

  return (
    <div>
      <Link href="/app" className="text-sm text-ink-soft underline underline-offset-4">
        ← Vault
      </Link>

      <h1 className="mt-5 font-serif text-4xl text-ink">
        {c.capture_type === "screenshot" ? c.text || "Screenshot" : c.text}
      </h1>

      {c.capture_type === "screenshot" && <CaptureImage id={c.id} alt={c.text || "Screenshot"} />}
      {c.capture_type === "link" && c.link_url && (
        <a
          href={c.link_url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block break-all text-sm text-accent underline underline-offset-2"
        >
          {c.link_url}
        </a>
      )}

      {c.sentence && (
        <p className="mt-3 text-sm text-ink-faint">
          &ldquo;…{c.sentence}…&rdquo;
          {c.source_url && (
            <>
              {" — "}
              <a href={c.source_url} target="_blank" rel="noreferrer" className="underline">
                {c.page_title || c.source_url}
              </a>
            </>
          )}
        </p>
      )}

      <ReferenceLayers c={c} />

      <NoteEditor capture={c} />

      <SpacePicker captureId={c.id} current={c.space_id} spaces={(spaces as Space[]) ?? []} />

      <section className="mt-10 flex items-center justify-between border-t border-line pt-4 text-sm text-ink-faint">
        <span>
          {card
            ? `Review: ${card.repetitions} reps · ease ${card.ease_factor.toFixed(2)} · next ${new Date(
                card.due_at,
              ).toLocaleDateString()}`
            : "No review card"}
        </span>
        <DeleteCaptureButton id={c.id} />
      </section>
    </div>
  );
}
