"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Capture } from "@lemma/shared";

export function NoteEditor({ capture }: { capture: Capture }) {
  const router = useRouter();
  const [note, setNote] = useState(capture.user_note ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setStatus("saving");
    const res = await fetch(`/api/captures/${capture.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user_note: note }),
    });
    if (res.ok) {
      setStatus("saved");
      router.refresh();
      setTimeout(() => setStatus("idle"), 1500);
    } else {
      setStatus("error");
    }
  }

  return (
    <div className="mt-4">
      <label className="text-xs uppercase tracking-wide text-ink-faint">Your understanding</label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={5}
        placeholder="In your own words…"
        className="note-artifact mt-2 w-full resize-y rounded-r-md border border-line bg-paper-raised px-3 py-2 text-[15px] leading-relaxed outline-none focus:border-accent"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={save}
          disabled={status === "saving" || !note.trim() || note === (capture.user_note ?? "")}
          className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-paper-raised transition hover:bg-accent-soft disabled:opacity-50"
        >
          {status === "saving" ? "Saving…" : "Save note"}
        </button>
        {status === "saved" && <span className="text-sm text-accent">Saved</span>}
        {status === "error" && <span className="text-sm text-red-700">Could not save</span>}
      </div>
    </div>
  );
}
