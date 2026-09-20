"use client";

import { useState } from "react";
import { CaptureDemo, DEMO_KINDS, type DemoKind } from "@/components/CaptureDemo";

const BLURB: Record<DemoKind, string> = {
  word: "Highlight a word, right-click, save.",
  passage: "Highlight any passage, right-click, save.",
  screenshot: "Right-click, drag a box around a formula or chart.",
  link: "Right-click a link and save it.",
  page: "Right-click anywhere on a page to save the whole thing.",
};

/** The capture animation with a chip per capture type, so visitors can replay it for each. */
export function CaptureDemoPicker() {
  const [kind, setKind] = useState<DemoKind>("word");

  return (
    <div>
      <CaptureDemo key={kind} kind={kind} />
      <div className="demo-chips mt-4" role="group" aria-label="What are you saving?">
        {DEMO_KINDS.map((k) => (
          <button key={k.id} type="button" className="demo-chip" aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
            {k.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink-soft">{BLURB[kind]}</p>
    </div>
  );
}
