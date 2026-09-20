"use client";

import { useEffect, useRef, useState } from "react";

const SPACE_NAME = "Things worth reading";
const EMAIL = "r@example.com";

function Chart() {
  return (
    <svg viewBox="0 0 220 96" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden>
      <rect width="220" height="96" fill="var(--paper-warm)" />
      <path d="M8 60 C50 58 70 56 100 44 S160 40 212 50" fill="none" stroke="var(--blue)" strokeWidth="2.5" />
      <path d="M8 62 C50 64 70 72 100 76 S160 60 212 52" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
    </svg>
  );
}

/**
 * Plays the real Spaces flow: name a space, type an email, press Invite, see the
 * pending row, then flip to what the invited person sees. Timer-driven so a
 * throttled tab just runs slower instead of stalling mid-sentence.
 */
export function SpacesDemo() {
  const [run, setRun] = useState(0);
  const [name, setName] = useState("");
  const [mail, setMail] = useState("");
  const [stage, setStage] = useState(0); // 0 name · 1 invite · 2 pending · 3 recipient
  const [pressed, setPressed] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  // Start when it scrolls into view, so a visitor doesn't miss the sequence below the fold.
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setStarted(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    setName("");
    setMail("");
    setStage(0);
    setPressed(false);
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    const type = (text: string, set: (v: string) => void, start: number, per: number) => {
      for (let i = 1; i <= text.length; i++) at(start + i * per, () => set(text.slice(0, i)));
      return start + text.length * per;
    };

    const nameDone = type(SPACE_NAME, setName, 400, 45);
    at(nameDone + 400, () => setStage(1));
    const mailDone = type(EMAIL, setMail, nameDone + 900, 55);
    at(mailDone + 400, () => setPressed(true));
    at(mailDone + 650, () => {
      setPressed(false);
      setStage(2);
    });
    at(mailDone + 2600, () => setStage(3));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [run, started]);

  return (
    <div ref={root}>
      <div className="sd">
        <div className="sd-head">
          <span>{stage === 3 ? "What they see" : "Your space"}</span>
          {stage === 3 && <span className="sd-badge">r@example.com</span>}
        </div>

        {stage < 3 ? (
          <div className="sd-body">
            <div className="sd-label">Space name</div>
            <div className="sd-input">
              {name}
              {stage === 0 && <b className="sd-caret" />}
            </div>

            {stage >= 1 && (
              <div className="sd-rise">
                <div className="sd-label">Invite by email</div>
                <div className="sd-row">
                  <div className="sd-input sd-grow">
                    {mail}
                    {stage === 1 && <b className="sd-caret" />}
                  </div>
                  <div className={`sd-btn ${pressed ? "pressed" : ""}`}>Invite</div>
                </div>
              </div>
            )}

            {stage >= 2 && (
              <div className="sd-pending sd-rise">
                <span>{EMAIL}</span>
                <span className="sd-tag">invited</span>
              </div>
            )}
          </div>
        ) : (
          <div className="sd-body sd-rise">
            <div className="sd-label">{SPACE_NAME}</div>
            <div className="sd-card">
              <div className="sd-shot">
                <Chart />
              </div>
              <div className="sd-cardtext">
                <div className="sd-title">Screenshot · two exchanges</div>
                <div className="sd-by">Shared by Alex</div>
              </div>
            </div>
            <div className="sd-card">
              <div className="sd-cardtext">
                <div className="sd-title">arbitrage</div>
                <div className="sd-by">Shared by Alex</div>
              </div>
            </div>
          </div>
        )}
      </div>
      <button type="button" onClick={() => setRun((n) => n + 1)} className="mt-3 text-sm text-ink-soft underline underline-offset-4 hover:text-ink">
        Replay
      </button>
    </div>
  );
}
