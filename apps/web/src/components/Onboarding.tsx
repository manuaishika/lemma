"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useGoogleEnabled } from "@/lib/useGoogleEnabled";
import { PENDING_ONBOARDING_KEY } from "@/components/PendingCaptureSync";

const WORD = "arbitrage";
const SENTENCE =
  "The traders spotted the same stock priced differently on two exchanges and locked in a risk-free profit through arbitrage before the gap closed.";
const EXPLANATION =
  "Here it means buying something where it's cheap and selling it where it's dear at the same moment, so the price gap turns into profit. It only lasts until other traders close the gap.";
const DEFINITION =
  "The simultaneous buying and selling of assets in different markets to profit from a difference in price.";
const EXAMPLE_NOTE =
  "Making money from a price gap before anyone else notices it, like flipping a concert ticket the second it's cheaper somewhere else.";

const GRADES = ["Again", "Hard", "Good", "Easy"] as const;
const LAST = 6;

function Rail({ step }: { step: number }) {
  return (
    <div className="ob-rail" role="progressbar" aria-valuemin={1} aria-valuemax={LAST + 1} aria-valuenow={step + 1}>
      {Array.from({ length: LAST + 1 }, (_, i) => (
        <div key={i} className={`ob-pip ${i <= step ? "done" : ""}`}>
          <i />
        </div>
      ))}
    </div>
  );
}

const primaryBtn =
  "press w-full rounded-xl bg-accent px-5 py-3.5 text-[15px] font-medium text-paper-raised hover:bg-accent-soft";
const textBtn = "text-sm text-ink-soft underline underline-offset-4 hover:text-ink";

export function Onboarding() {
  const router = useRouter();
  const googleEnabled = useGoogleEnabled();

  const [step, setStep] = useState(0);

  // screen 2
  const [tapped, setTapped] = useState(false);
  const [explained, setExplained] = useState(false);
  // screen 3
  const [note, setNote] = useState("");
  const [typing, setTyping] = useState(false);
  const typer = useRef<ReturnType<typeof setInterval> | null>(null);
  // screen 4
  const [flipped, setFlipped] = useState(false);
  const [gone, setGone] = useState(false);
  // screen 5
  const [sent, setSent] = useState(false);
  // screen 6
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => () => {
    if (typer.current) clearInterval(typer.current);
  }, []);

  function tapWord() {
    if (tapped) return;
    setTapped(true);
    setTimeout(() => setExplained(true), 1200);
  }

  function typeExample() {
    if (typing) return;
    setTyping(true);
    setNote("");
    // Derive progress from elapsed time so a throttled timer can't stretch the animation.
    const start = performance.now();
    typer.current = setInterval(() => {
      const i = Math.min(EXAMPLE_NOTE.length, Math.floor((performance.now() - start) / 22));
      setNote(EXAMPLE_NOTE.slice(0, i));
      if (i >= EXAMPLE_NOTE.length) {
        if (typer.current) clearInterval(typer.current);
        setTyping(false);
      }
    }, 22);
  }

  function grade() {
    if (!flipped || gone) return;
    setGone(true);
    setTimeout(() => setStep(4), 650);
  }

  /** Park the sample capture so the app can save it once they're signed in. */
  function persistCapture() {
    try {
      localStorage.setItem(
        PENDING_ONBOARDING_KEY,
        JSON.stringify({
          text: WORD,
          capture_type: "term",
          sentence: SENTENCE,
          page_title: "Lemma — your first capture",
          explanation: EXPLANATION,
          dictionary_definition: DEFINITION,
          user_note: note.trim(),
        }),
      );
    } catch {
      // storage blocked: they still get an account, just not the sample capture
    }
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    persistCapture();
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) return setError(error.message);
    if (!data.session) return setCheckEmail(true); // "Confirm email" is on
    setStep(6);
  }

  async function google() {
    setError(null);
    persistCapture();
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/app` },
    });
    if (error) setError(error.message);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[440px] flex-col px-6 pb-10 pt-8">
      <Rail step={step} />

      <div key={step} className="ob-screen flex flex-1 flex-col justify-center gap-6 py-8">
        {step === 0 && (
          <>
            <p className="font-serif text-5xl italic text-ink">Lemma</p>
            <p className="font-serif text-2xl leading-snug text-ink">
              You read something worth keeping, and you save it.
              <br />
              Then it sits in a folder, and you forget it.
            </p>
            <p className="text-[15px] text-ink-soft">
              Lemma asks you to say why it mattered, then brings it back until it sticks.
            </p>
            <div className="flex flex-col items-center gap-4 pt-2">
              <button className={primaryBtn} onClick={() => setStep(1)}>
                Show me how
              </button>
              <Link href="/login" className={textBtn}>
                I&apos;ve used Lemma before
              </Link>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-xs uppercase tracking-wide text-ink-faint">1 · Capture</p>
            <p className="font-serif text-[22px] leading-relaxed text-ink">
              The traders spotted the same stock priced differently on two exchanges and locked in a
              risk-free profit through{" "}
              <button type="button" className={`ob-word ${tapped ? "on" : ""}`} onClick={tapWord}>
                {WORD}
              </button>{" "}
              before the gap closed.
            </p>
            <div className={`ob-panel ${tapped ? "open" : ""}`}>
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-ink-faint">How it&apos;s used here</p>
                {explained ? (
                  <p className="explanation-scaffold">{EXPLANATION}</p>
                ) : (
                  <div className="space-y-2.5 pt-1" aria-label="Loading">
                    <div className="ob-shimmer" />
                    <div className="ob-shimmer" style={{ width: "92%" }} />
                    <div className="ob-shimmer" style={{ width: "64%" }} />
                  </div>
                )}
              </div>
            </div>
            {!tapped && <p className="text-sm text-ink-faint">Tap the underlined word.</p>}
            <button className={primaryBtn} disabled={!tapped} onClick={() => setStep(2)}>
              Next
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-xs uppercase tracking-wide text-ink-faint">2 · Your note</p>
            <div className="rounded-xl bg-paper-warm px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-ink-ghost">Dictionary</p>
              <p className="mt-1 text-sm text-ink-faint">{DEFINITION}</p>
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ink">The definition isn&apos;t the point.</h2>
              <p className="mt-1 text-[15px] text-ink-soft">
                Write why <em>{WORD}</em> mattered to you.
              </p>
            </div>
            <div>
              <textarea
                id="ob-note"
                className="ob-note"
                rows={4}
                placeholder="In your own words…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                readOnly={typing}
              />
              <button type="button" className={`${textBtn} mt-3`} onClick={typeExample} disabled={typing}>
                Type an example for me
              </button>
            </div>
            <button className={primaryBtn} disabled={!note.trim() || typing} onClick={() => setStep(3)}>
              Next
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-xs uppercase tracking-wide text-ink-faint">3 · It comes back</p>
            <p className="text-[15px] text-ink-soft">
              A few days later, Lemma shows you the word. Tap to see what you wrote.
            </p>
            <div className={`ob-stack ${gone ? "launched" : ""}`}>
              <div className="ob-card l2" aria-hidden />
              <div className="ob-card l1" aria-hidden />
              <div
                className={`ob-card front ${gone ? "gone" : ""}`}
                role="button"
                tabIndex={0}
                aria-label="Flip card"
                onClick={() => setFlipped(true)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setFlipped(true)}
              >
                <div className={`ob-flip ${flipped ? "flipped" : ""}`}>
                  <div className="ob-face">
                    <p className="font-serif text-4xl text-ink">{WORD}</p>
                    <p className="mt-3 text-sm text-ink-faint">Tap to flip</p>
                  </div>
                  <div className="ob-face back">
                    <p className="text-xs uppercase tracking-wide text-ink-faint">You wrote</p>
                    <p className="note-artifact mt-3 font-serif text-lg leading-relaxed">{note}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className={`ob-grades ${flipped && !gone ? "show" : ""}`}>
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
          </>
        )}

        {step === 4 && (
          <>
            <p className="text-xs uppercase tracking-wide text-ink-faint">4 · Spaces</p>
            <h2 className="font-serif text-2xl text-ink">Share it with someone.</h2>
            <p className="text-[15px] text-ink-soft">
              Make a space, invite a friend by email, and whatever either of you saves shows up for both.
            </p>
            <div className={`ob-space ${sent ? "sent" : ""}`}>
              <div className="flex items-center gap-2 py-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="ob-node near">You</div>
                </div>
                <div className="ob-wire">
                  <i />
                  <span className="ob-fly" />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="ob-node far">A</div>
                </div>
              </div>
              <p className="min-h-6 text-center text-sm text-accent" aria-live="polite">
                {sent ? `Landed, with your note attached.` : ""}
              </p>
            </div>
            {!sent ? (
              <button className={primaryBtn} onClick={() => setSent(true)}>
                Try sending it
              </button>
            ) : (
              <button className={primaryBtn} onClick={() => setStep(5)}>
                Continue
              </button>
            )}
          </>
        )}

        {step === 5 && (
          <>
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-accent-light px-3.5 py-1.5 text-sm text-ink">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span>
                <em className="font-serif">{WORD}</em> is waiting in your vault
              </span>
            </div>
            <div>
              <h2 className="font-serif text-3xl text-ink">Keep it.</h2>
              <p className="mt-1 text-[15px] text-ink-soft">Create an account and your first capture is saved.</p>
            </div>
            {checkEmail ? (
              <div className="rounded-xl border border-line bg-paper-raised p-4 text-sm text-ink-soft">
                We sent a confirmation link to <span className="font-medium text-ink">{email}</span>. Click it,
                then sign in. Your note is saved on this device and will be added to your vault.
                <div className="mt-3">
                  <Link href="/login" className={textBtn}>
                    Go to sign in
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {googleEnabled && (
                  <>
                    <button type="button" onClick={google} className="press w-full rounded-xl border border-line bg-paper-raised py-3 text-sm font-medium text-ink">
                      Continue with Google
                    </button>
                    <div className="flex items-center gap-3 text-xs text-ink-faint">
                      <span className="h-px flex-1 bg-line" />
                      or
                      <span className="h-px flex-1 bg-line" />
                    </div>
                  </>
                )}
                <form onSubmit={signUp} className="space-y-3">
                  <input
                    id="ob-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-line bg-paper-raised px-4 py-3 text-[15px] outline-none focus:border-accent"
                  />
                  <input
                    id="ob-password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="Password (6+ characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-line bg-paper-raised px-4 py-3 text-[15px] outline-none focus:border-accent"
                  />
                  {error && <p className="text-sm text-red">{error}</p>}
                  <button type="submit" disabled={busy} className={primaryBtn}>
                    {busy ? "Creating…" : "Create my vault"}
                  </button>
                </form>
                <p className="text-center text-sm text-ink-faint">
                  Already have an account?{" "}
                  <Link href="/login" className="underline underline-offset-4">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </>
        )}

        {step === 6 && (
          <>
            <svg className="ob-check" width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
              <circle cx="32" cy="32" r="30" fill="var(--accent)" />
              <path d="M19 33l9 9 17-19" stroke="var(--surface)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h2 className="font-serif text-3xl text-ink">Your vault is ready.</h2>
            <ul className="divide-y divide-line border-y border-line text-[15px]">
              {[
                ["Capture", "Right-click a word, a screenshot or a link."],
                ["Your note", "Write why it mattered. That's the part you keep."],
                ["It comes back", "Again, Hard, Good or Easy sets when you see it next."],
                ["Spaces", "Share a folder with a friend by email."],
              ].map(([k, v]) => (
                <li key={k} className="flex gap-4 py-3">
                  <span className="w-28 shrink-0 font-serif italic text-ink-faint">{k}</span>
                  <span className="text-ink-soft">{v}</span>
                </li>
              ))}
            </ul>
            <button
              className={primaryBtn}
              onClick={() => {
                router.push("/app");
                router.refresh();
              }}
            >
              Open my vault
            </button>
          </>
        )}
      </div>
    </main>
  );
}
