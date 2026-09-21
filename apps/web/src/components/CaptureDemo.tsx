"use client";

import { useLayoutEffect, useRef, useState } from "react";

export type DemoKind = "word" | "passage" | "screenshot" | "link" | "page";

export const DEMO_KINDS: { id: DemoKind; label: string }[] = [
  { id: "word", label: "Word" },
  { id: "passage", label: "Passage" },
  { id: "screenshot", label: "Screenshot" },
  { id: "link", label: "Link" },
  { id: "page", label: "Page" },
];

const SENTENCE_A = "The traders spotted the same stock priced differently on two exchanges and locked in a risk-free profit through ";
const SENTENCE_B = " before the gap closed.";

function Chart() {
  return (
    <svg viewBox="0 0 220 96" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" role="img" aria-label="Two price lines diverging, then meeting">
      <rect width="220" height="96" fill="var(--paper-warm)" />
      <path d="M8 60 C50 58 70 56 100 44 S160 40 212 50" fill="none" stroke="var(--blue)" strokeWidth="2.5" />
      <path d="M8 62 C50 64 70 72 100 76 S160 60 212 52" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
      <text x="10" y="14" fontSize="9" fill="var(--ink-faint)" fontFamily="system-ui">Exchange A vs B</text>
    </svg>
  );
}

const MENU_LABEL: Record<DemoKind, string> = {
  word: "Save “arbitrage” to Lemma",
  passage: "Save “The traders spotted…” to Lemma",
  screenshot: "Save screenshot to Lemma (select area)",
  link: "Save this link to Lemma",
  page: "Save this page to Lemma",
};

function Popup({ kind }: { kind: DemoKind }) {
  const title =
    kind === "word"
      ? "arbitrage"
      : kind === "passage"
        ? "The traders spotted the same stock priced differently…"
        : kind === "screenshot"
          ? "Screenshot"
          : kind === "link"
            ? "Read the full paper"
            : "Markets, explained";

  return (
    <div className="demo-popup" aria-hidden>
      <div className="demo-pop-brand">Lemma</div>
      {kind === "screenshot" && (
        <div className="demo-pop-shot">
          <Chart />
        </div>
      )}
      <div className="demo-pop-title">{title}</div>
      <div className="demo-pop-kind">{kind}</div>
      {(kind === "link" || kind === "page") && <div className="demo-pop-url">reading.example.com/{kind === "link" ? "paper" : "markets"}</div>}
      {kind === "word" && (
        <>
          <div className="demo-pop-label">Definition</div>
          <div className="demo-pop-def">buying and selling the same thing in different markets to profit from the price gap.</div>
          <div className="demo-pop-label">How it’s used here</div>
          <div className="demo-pop-ctx">Bought cheap on one exchange, sold high on another.</div>
        </>
      )}
      <div className="demo-pop-label">Your note (optional)</div>
      <div className="demo-pop-note">Why did this matter to you?</div>
      <div className="demo-pop-save">Save</div>
    </div>
  );
}

/**
 * A fake browser replaying the real capture sequence: select → right-click →
 * "Save to Lemma" → the popup slides in. Re-keyed per kind so it restarts.
 * Positions are measured off the real target so the cursor never misses.
 */
export function CaptureDemo({ kind }: { kind: DemoKind }) {
  const frame = useRef<HTMLDivElement>(null);
  const [vars, setVars] = useState<Record<string, string>>({});

  useLayoutEffect(() => {
    function measure() {
      const f = frame.current;
      if (!f) return;
      const target = f.querySelector<HTMLElement>(".demo-target");
      if (!target) return;
      const fr = f.getBoundingClientRect();
      const first = target.getClientRects()[0] ?? target.getBoundingClientRect();
      const cx = first.left - fr.left + Math.min(first.width, 60) / 2 + 10;
      const cy = first.top - fr.top + first.height / 2;
      const mx = Math.max(8, Math.min(cx, fr.width - 212));
      const my = Math.max(40, Math.min(cy + 10, fr.height - 152));
      const tr = target.getBoundingClientRect();
      setVars({
        "--cx": `${cx}px`,
        "--cy": `${cy}px`,
        "--mx": `${mx}px`,
        "--my": `${my}px`,
        "--ml": `${tr.left - fr.left}px`,
        "--mt": `${tr.top - fr.top}px`,
        "--mw": `${tr.width}px`,
        "--mh": `${tr.height}px`,
      });
    }
    measure();
    void document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [kind]);

  const greyBefore = kind === "word" || kind === "passage" ? ["Copy", "Search Google for the selection"] : ["Back", "Reload"];
  const greyAfter = kind === "word" || kind === "passage" ? ["Print…"] : ["View page source", "Inspect"];

  return (
    <div className="demo" ref={frame} style={vars as React.CSSProperties} role="img" aria-label={`Animation: saving a ${kind} with a right-click`}>
      <div className="demo-bar">
        <i /> <i /> <i />
        <span>reading.example.com/markets</span>
      </div>

      <div className="demo-body">
        <p>
          {kind === "passage" ? (
            <span className="demo-sel demo-target">
              {SENTENCE_A}arbitrage{SENTENCE_B}
            </span>
          ) : (
            <>
              {SENTENCE_A}
              {kind === "word" ? <span className="demo-sel demo-target">arbitrage</span> : "arbitrage"}
              {SENTENCE_B}
            </>
          )}
        </p>
        {kind === "screenshot" && (
          <div className="demo-shot demo-target">
            <Chart />
          </div>
        )}
        {kind === "link" && (
          <p className="demo-linkrow">
            <span className="demo-link demo-sel demo-target">Read the full paper →</span>
          </p>
        )}
        {kind === "page" && <span className="demo-target demo-pagetarget" />}
      </div>

      {kind === "screenshot" && <div className="demo-marquee" />}
      {kind === "page" && <div className="demo-pageflash" />}

      <div className="demo-menu" aria-hidden>
        {greyBefore.map((t) => (
          <div key={t} className="demo-item">{t}</div>
        ))}
        <div className="demo-item hot">{MENU_LABEL[kind]}</div>
        {greyAfter.map((t) => (
          <div key={t} className="demo-item">{t}</div>
        ))}
      </div>

      <svg className="demo-cursor" width="16" height="20" viewBox="0 0 16 20" aria-hidden>
        <path d="M1 1v15l4-4 3 7 3-1.4-3-6.6h6z" fill="#111" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>

      <Popup kind={kind} />
    </div>
  );
}
