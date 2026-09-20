"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** "Still want to look at this?" — Done stops the reminders, Snooze brings it back in a week. */
export function RevisitActions({ captureId }: { captureId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"done" | "snooze" | null>(null);
  const [error, setError] = useState(false);

  async function patch(kind: "done" | "snooze", body: Record<string, unknown>) {
    setBusy(kind);
    setError(false);
    try {
      const res = await fetch(`/api/captures/${captureId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("update failed");
      router.refresh();
    } catch {
      setError(true);
      setBusy(null);
    }
  }

  return (
    <div className="mt-4 flex items-center gap-3">
      <button
        onClick={() => patch("done", { resurface: "keep" })}
        disabled={busy !== null}
        className="press rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-paper-raised hover:bg-accent-soft"
      >
        {busy === "done" ? "Saving…" : "Done"}
      </button>
      <button
        onClick={() => patch("snooze", { remind_at: new Date(Date.now() + WEEK_MS).toISOString(), reminder_sent: false })}
        disabled={busy !== null}
        className="press rounded-lg border border-line bg-paper-raised px-4 py-1.5 text-sm font-medium text-ink"
      >
        {busy === "snooze" ? "Saving…" : "Snooze a week"}
      </button>
      {error && <span className="text-sm text-red">Couldn&rsquo;t update that</span>}
    </div>
  );
}
