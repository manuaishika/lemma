"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GRADE_LABELS, GRADES, previewIntervals, type DueCard, type Grade } from "@lemma/shared";
import { CaptureImage } from "./CaptureImage";
import { ReferenceLayers } from "./ReferenceLayers";

function humanInterval(days: number): string {
  if (days <= 1) return "1d";
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

export function ReviewSession({ initial }: { initial: DueCard[] }) {
  const router = useRouter();
  const [queue] = useState(initial);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);

  const current = queue[index];

  const preview = useMemo(() => {
    if (!current) return null;
    return previewIntervals({
      easeFactor: current.card.ease_factor,
      intervalDays: current.card.interval_days,
      repetitions: current.card.repetitions,
    });
  }, [current]);

  if (!current) {
    return (
      <div className="mt-16 text-center">
        <p className="font-serif text-2xl text-ink">
          {done > 0 ? `Reviewed ${done}. Nothing left due.` : "Nothing due right now."}
        </p>
        <Link
          href="/app"
          className="mt-4 inline-block text-sm text-accent underline underline-offset-4"
        >
          Back to vault
        </Link>
      </div>
    );
  }

  async function grade(g: Grade) {
    if (busy || !current) return;
    setBusy(true);
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ card_id: current.card.id, grade: g }),
    });
    setBusy(false);
    if (!res.ok) return;
    setDone((d) => d + 1);
    setRevealed(false);
    setIndex((i) => i + 1);
    if (index + 1 >= queue.length) router.refresh();
  }

  const c = current.capture;

  return (
    <div className="mt-8">
      <p className="text-xs text-ink-faint">
        {index + 1} / {queue.length}
      </p>

      <div className="mt-6 text-center">
        <h1 className="font-serif text-4xl text-ink">
          {c.capture_type === "screenshot" ? c.text || "Screenshot" : c.text}
        </h1>
        {c.capture_type === "screenshot" && (
          <div className="mx-auto mt-4 max-w-md text-left">
            <CaptureImage id={c.id} alt={c.text || "Screenshot"} />
          </div>
        )}
        {c.capture_type === "link" && c.link_url && (
          <p className="mx-auto mt-2 max-w-md truncate text-sm text-ink-faint">{c.link_url}</p>
        )}
        {c.sentence && (
          <p className="mx-auto mt-4 max-w-md text-sm text-ink-faint">
            &ldquo;…{c.sentence.replace(c.text, " ")}…&rdquo;
          </p>
        )}
      </div>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="mx-auto mt-10 block rounded-md border border-line px-5 py-2 text-sm text-ink-soft hover:border-accent"
        >
          Show my understanding
        </button>
      ) : (
        <div className="mx-auto mt-8 max-w-md">
          <ReferenceLayers c={c} />
          {c.user_note ? (
            <p className="note-artifact mt-6 whitespace-pre-wrap text-[15px] leading-relaxed">
              {c.user_note}
            </p>
          ) : (
            !c.dictionary_definition &&
            !c.encyclopedic_summary &&
            !c.explanation && (
              <p className="text-sm italic text-ink-faint">Nothing else was saved with this capture.</p>
            )
          )}

          <div className="mt-8 grid grid-cols-4 gap-2">
            {GRADES.map((g) => (
              <button
                key={g}
                onClick={() => grade(g)}
                disabled={busy}
                className="rounded-md border border-line py-2 text-sm hover:border-accent disabled:opacity-50"
              >
                <span className="block text-ink">{GRADE_LABELS[g]}</span>
                <span className="block text-xs text-ink-faint">
                  {preview ? humanInterval(preview[g]) : ""}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
