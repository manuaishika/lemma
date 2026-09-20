"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { defaultResurface, effectiveResurface, type Capture, type Resurface } from "@lemma/shared";

const LABELS: Record<Resurface, string> = {
  review: "Review me (graded)",
  revisit: "Remind me (no grading)",
  keep: "Don't bring it back",
};

/** Lemma picks how a capture comes back from what it is; this changes it for one item. */
export function ResurfaceToggle({ capture }: { capture: Capture }) {
  const router = useRouter();
  const auto = defaultResurface(capture.capture_type);
  const [value, setValue] = useState<Resurface>(effectiveResurface(capture));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function change(next: Resurface) {
    const prev = value;
    setValue(next);
    setStatus("saving");
    try {
      const res = await fetch(`/api/captures/${capture.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        // Going back to the automatic choice stores nothing, so it keeps following the capture type.
        body: JSON.stringify({ resurface: next === auto ? null : next }),
      });
      if (!res.ok) throw new Error("update failed");
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
      <label htmlFor="resurface" className="text-xs uppercase tracking-wide text-ink-faint">
        How it comes back
      </label>
      <div className="mt-2 flex items-center gap-3">
        <select
          id="resurface"
          value={value}
          onChange={(e) => change(e.target.value as Resurface)}
          disabled={status === "saving"}
          className="rounded-md border border-line bg-paper-raised px-3 py-1.5 text-sm text-ink outline-none focus:border-accent"
        >
          {(Object.keys(LABELS) as Resurface[]).map((k) => (
            <option key={k} value={k}>
              {LABELS[k]}
              {k === auto ? " (automatic)" : ""}
            </option>
          ))}
        </select>
        {status === "saved" && <span className="text-sm text-accent">Saved</span>}
        {status === "error" && <span className="text-sm text-red">Couldn&rsquo;t change it</span>}
      </div>
    </div>
  );
}
