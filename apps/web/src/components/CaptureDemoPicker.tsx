"use client";

import { CaptureDemo, DEMO_KINDS, type DemoKind } from "@/components/CaptureDemo";
import { HoverTabs, useAutoCycle, type TabIconName } from "@/components/HoverTabs";

const CYCLE_MS = 8000; // one full pass of the capture animation

const BLURB: Record<DemoKind, string> = {
  word: "Highlight a word, right-click, save. The definition is already there.",
  passage: "Highlight any passage, right-click, save it with where it came from.",
  screenshot: "Right-click, drag a box around a formula or a chart. Only that part is kept.",
  link: "Right-click any link and it's saved, with the page you found it on.",
  page: "Right-click anywhere on a page to keep the whole thing.",
};

const ICON: Record<DemoKind, TabIconName> = {
  word: "word",
  passage: "passage",
  screenshot: "screenshot",
  link: "link",
  page: "page",
};

/**
 * The capture animation, one type after another on its own. Hover a tab to jump straight
 * to it (no click), and it holds while you're there.
 */
export function CaptureDemoPicker() {
  const cycle = useAutoCycle(DEMO_KINDS.length, CYCLE_MS);
  const kind = DEMO_KINDS[cycle.index]!.id;

  return (
    <div>
      <CaptureDemo key={kind} kind={kind} />
      <div className="mt-4">
        <HoverTabs
          label="What are you saving?"
          items={DEMO_KINDS.map((k) => ({ id: k.id, label: k.label, icon: ICON[k.id] }))}
          active={cycle.index}
          hold={cycle.hold}
          cycleMs={CYCLE_MS}
          onEnter={cycle.enter}
          onLeave={cycle.leave}
          onPick={cycle.pick}
        />
      </div>
      <p className="mt-3 text-sm text-ink-soft">{BLURB[kind]}</p>
      <p className="mt-1 text-xs text-ink-faint">Plays through every type by itself. Hover a tab to jump to it.</p>
    </div>
  );
}
