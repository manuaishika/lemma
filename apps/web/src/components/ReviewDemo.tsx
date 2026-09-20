"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const GRADES = ["Again", "Hard", "Good", "Easy"] as const;
const ACTIONS = ["Done", "Snooze"] as const;

function Chart() {
  return (
    <svg viewBox="0 0 220 96" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" role="img" aria-label="Two price lines diverging, then meeting">
      <rect width="220" height="96" fill="var(--paper-warm)" />
      <path d="M8 60 C50 58 70 56 100 44 S160 40 212 50" fill="none" stroke="var(--blue)" strokeWidth="2.5" />
      <path d="M8 62 C50 64 70 72 100 76 S160 60 212 52" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
    </svg>
  );
}

type Card = {
  kind: string;
  mode: "review" | "revisit";
  title: string | null;
  sub: string | null;
  chart: boolean;
  note: string;
  pick: string;
};

// Words and formulas get graded; links, pages and passages get a nudge. Lemma chooses, not you.
const CARDS: Card[] = [
  { kind: "Word", mode: "review", title: "arbitrage", sub: null, chart: false, note: "Making money from a price gap before anyone else notices it.", pick: "Good" },
  { kind: "Screenshot", mode: "review", title: null, sub: "Two exchanges", chart: true, note: "Two exchanges drifting apart. That gap is the whole trade.", pick: "Easy" },
  { kind: "Link", mode: "revisit", title: "Read the full paper", sub: "reading.example.com/paper", chart: false, note: "The argument I want to cite in my essay.", pick: "Done" },
];

type Phase = "front" | "flipped" | "pressed" | "gone";

/**
 * A review deck that plays itself — flip, grade, next card drops in — and still answers to a tap.
 * A word and a screenshot are graded; the link isn't, it just asks "still want to look at this?".
 * Autoplay pauses while you're driving it and picks up again after a few idle seconds.
 */
export function ReviewDemo() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("front");
  const [manual, setManual] = useState(false);
  const [reduced, setReduced] = useState(false);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const card = CARDS[idx]!;
  const isReview = card.mode === "review";

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    return () => {
      if (idle.current) clearTimeout(idle.current);
    };
  }, []);

  // The autoplay script: one timer per phase, restarted whenever the phase or card changes.
  useEffect(() => {
    if (manual || reduced) return;
    let ms: number;
    let next: () => void;
    if (phase === "front") {
      ms = 1700;
      next = () => setPhase(isReview ? "flipped" : "pressed");
    } else if (phase === "flipped") {
      ms = 2100;
      next = () => setPhase("pressed");
    } else if (phase === "pressed") {
      ms = 800;
      next = () => setPhase("gone");
    } else {
      ms = 650;
      next = () => {
        setIdx((i) => (i + 1) % CARDS.length);
        setPhase("front");
      };
    }
    const t = setTimeout(next, ms);
    return () => clearTimeout(t);
  }, [phase, idx, manual, reduced, isReview]);

  // Any touch hands control to the visitor; a few idle seconds later autoplay resumes.
  const takeOver = useCallback(() => {
    setManual(true);
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => setManual(false), 7000);
  }, []);

  function flip() {
    takeOver();
    if (isReview && phase === "front") setPhase("flipped");
  }

  function choose() {
    takeOver();
    if (phase === "gone" || phase === "pressed") return;
    setPhase("gone");
    setTimeout(() => {
      setIdx((i) => (i + 1) % CARDS.length);
      setPhase("front");
    }, 650);
  }

  const flipped = phase === "flipped" || (isReview && phase === "pressed") || (isReview && phase === "gone");
  const gone = phase === "gone";
  const showGrades = isReview && (phase === "flipped" || phase === "pressed");
  const showActions = !isReview && (phase === "front" || phase === "pressed");
  const pressed = phase === "pressed" ? card.pick : null;

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
          aria-label={isReview ? "Flip card" : "Reminder card"}
          onClick={flip}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && flip()}
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
              <p className="text-sm text-ink-faint">{isReview ? "Tap to flip" : "Still want to look at this?"}</p>
            </div>
            <div className="ob-face back">
              <p className="text-xs uppercase tracking-wide text-ink-faint">You wrote</p>
              <p className="note-artifact mt-3 font-serif text-lg leading-relaxed">{card.note}</p>
            </div>
          </div>
        </div>
      </div>

      {/* one fixed-height slot so the layout never jumps between the two behaviors */}
      <div className="mt-6 h-[50px]">
        {isReview ? (
          <div className={`ob-grades ${showGrades && !gone ? "show" : ""}`}>
            {GRADES.map((g) => (
              <button
                key={g}
                className={`press demo-btn ${pressed === g ? "is-pressed" : ""}`}
                onClick={choose}
                tabIndex={showGrades ? 0 : -1}
              >
                {g}
              </button>
            ))}
          </div>
        ) : (
          <div className={`grid grid-cols-2 gap-2 transition-opacity duration-300 ${showActions && !gone ? "opacity-100" : "opacity-0"}`}>
            {ACTIONS.map((a) => (
              <button
                key={a}
                className={`press demo-btn ${pressed === a ? "is-pressed" : ""}`}
                onClick={choose}
                tabIndex={showActions ? 0 : -1}
              >
                {a}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="mt-3 text-sm text-ink-faint">
        {isReview ? "Words and formulas are graded." : "Links and pages get a nudge, no grading."} Tap to play it
        yourself.
      </p>
    </div>
  );
}
