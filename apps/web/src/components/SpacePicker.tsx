"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Space } from "@lemma/shared";

/** Move any capture — word, screenshot, link — into a shared space, or back to your vault. */
export function SpacePicker({
  captureId,
  current,
  spaces,
}: {
  captureId: string;
  current: string | null;
  spaces: Space[];
}) {
  const router = useRouter();
  const [value, setValue] = useState(current ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function change(next: string) {
    const prev = value;
    setValue(next);
    setStatus("saving");
    try {
      const res = await fetch(`/api/captures/${captureId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ space_id: next || null }),
      });
      if (!res.ok) throw new Error("move failed");
      setStatus("saved");
      router.refresh();
      setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setValue(prev);
      setStatus("error");
    }
  }

  return (
    <div className="mt-8">
      <label htmlFor="space-picker" className="text-xs uppercase tracking-wide text-ink-faint">
        Share to a space
      </label>
      <div className="mt-2 flex items-center gap-3">
        <select
          id="space-picker"
          value={value}
          onChange={(e) => change(e.target.value)}
          disabled={status === "saving"}
          className="rounded-md border border-line bg-paper-raised px-3 py-1.5 text-sm text-ink outline-none focus:border-accent"
        >
          <option value="">Only me (my vault)</option>
          {spaces.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {status === "saved" && <span className="text-sm text-accent">Saved</span>}
        {status === "error" && <span className="text-sm text-red">Couldn&rsquo;t move it</span>}
      </div>
      {spaces.length === 0 && (
        <p className="mt-2 text-sm text-ink-faint">
          You&rsquo;re not in any spaces yet.{" "}
          <Link href="/app/spaces/new" className="underline underline-offset-4">
            Create one
          </Link>
          , invite someone by email, then share captures into it.
        </p>
      )}
    </div>
  );
}
