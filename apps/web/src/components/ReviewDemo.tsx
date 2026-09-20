"use client";

import { useEffect, useRef, useState } from "react";

const GRADES = ["Again", "Hard", "Good", "Easy"] as const;

function Chart() {
  return (
    <svg viewBox="0 0 220 96" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" role="img" aria-label="Two price lines diverging, then meeting">
      <rect width="220" height="96" fill="var(--paper-warm)" />
      <path d="M8 60 C50 58 70 56 100 44 S160 40 212 50" fill="none" stroke="var(--blue)" strokeWidth="2.5" />
      <path d="M8 62 C50 64 70 72 100 76 S160 60 212 52" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
    </svg>
  );
}

const CARDS = [
  { kind: "Word", title: "arbitrage", sub: null, chart: false, note: "Making money from a price gap before anyone else notices it." },
  { kind: "Screenshot", title: null, sub: "Two exchanges", chart: true, note: "Two exchanges drifting apart. That gap is the whole trade." },
  { kind: "Link", title: "Read the full paper", sub: "reading.example.com/paper", chart: false, note: "The argument I want to cite in my essay." },
];

/** A working review deck: tap to flip, grade, and the next capture (a different type) drops in. */
export function ReviewDemo() {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [gone, setGone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const card = CARDS[idx]!;

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function grade() {
    if (!flipped || gone) return;
    setGone(true);
    timer.current = setTimeout(() => {
      setIdx((i) => (i + 1) % CARDS.length);
      setFlipped(false);
      setGone(false);
    }, 650);
  }

  return (
    <div>
      <div className={`ob-stack ${gone ? "launched" : ""}`}>
        <div className="ob-card l2" aria-hidden />
        <div className="ob-card l1" aria-hidden />
        <div
          key={idx}
          className={`ob-card front demo-enter ${gone ? "gone" : ""}`}
          role="button"
          tabIndex={0}
          aria-label="Flip card"
          onClick={() => setFlipped(true)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setFlipped(true)}
        >
          <div className={`ob-flip ${flipped ? "flipped" : ""}`}>
            <div className="ob-face">
              {card.chart && (
                <div className="mb-3 h-24 overflow-hidden rounded-lg border border-line">
                  <Chart />
                </div>
              )}
              {card.title && <p className="font-serif text-3xl text-ink">{card.title}</p>}
              {card.sub && <p className="mt-1 text-sm text-ink-faint">{card.sub}</p>}
              <p className="mt-3 text-xs uppercase tracking-wide text-ink-faint">{card.kind}</p>
              <p className="text-sm text-ink-faint">Tap to flip</p>
            </div>
            <div className="ob-face back">
              <p className="text-xs uppercase tracking-wide text-ink-faint">You wrote</p>
              <p className="note-artifact mt-3 font-serif text-lg leading-relaxed">{card.note}</p>
            </div>
          </div>
        </div>
      </div>
      <div className={`ob-grades mt-6 ${flipped && !gone ? "show" : ""}`}>
        {GRADES.map((g) => (
          <button
            key={g}
            className="press rounded-xl border border-line bg-paper-raised py-3 text-sm font-medium text-ink"
            onClick={grade}
            tabIndex={flipped ? 0 : -1}
          >
            {g}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm text-ink-faint">
        {flipped ? "Grade it and the next one drops in." : "Try it: tap the card."}
      </p>
    </div>
  );
}
