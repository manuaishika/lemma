"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PENDING_ONBOARDING_KEY } from "@/components/PendingCaptureSync";
import { CaptureDemoPicker } from "@/components/CaptureDemoPicker";
import { SpacesDemo } from "@/components/SpacesDemo";
import { ErrorNote, Field, GoogleButton, SubmitButton, Divider, friendlyError } from "@/components/AuthKit";

const WORD = "arbitrage";
const SENTENCE =
  "The traders spotted the same stock priced differently on two exchanges and locked in a risk-free profit through arbitrage before the gap closed.";
const DEFINITION =
  "(noun) the simultaneous buying and selling of assets in different markets to profit from a difference in price.";
const WIKI =
  "Arbitrage is the practice of taking advantage of a price difference between two or more markets, striking a combination of matching deals to capture the imbalance as profit.";
const CONTEXT =
  "Here it means the traders bought on the cheaper exchange and sold on the dearer one at the same moment, so the gap turned into risk-free profit. It only lasts until others close the gap.";
const EXAMPLE_NOTE =
  "Making money from a price gap before anyone else notices it, like flipping a concert ticket the second it's cheaper somewhere else.";

const GRADES = ["Again", "Hard", "Good", "Easy"] as const;
const LAST = 7;

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

function ChartCard() {
  return (
    <svg viewBox="0 0 220 96" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" role="img" aria-label="Two price lines diverging, then meeting">
      <rect width="220" height="96" fill="var(--paper-warm)" />
      <path d="M8 60 C50 58 70 56 100 44 S160 40 212 50" fill="none" stroke="var(--blue)" strokeWidth="2.5" />
      <path d="M8 62 C50 64 70 72 100 76 S160 60 212 52" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
    </svg>
  );
}

const primaryBtn =
  "press w-full rounded-xl bg-accent px-5 py-3.5 text-[15px] font-medium text-paper-raised hover:bg-accent-soft";
const secondaryBtn =
  "press w-full rounded-xl border border-line bg-paper-raised px-5 py-3.5 text-[15px] font-medium text-ink";
const textBtn = "text-sm text-ink-soft underline underline-offset-4 hover:text-ink";

export function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [note, setNote] = useState("");
  const [typing, setTyping] = useState(false);
  const typer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [gone, setGone] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(
    () => () => {
      if (typer.current) clearInterval(typer.current);
    },
    [],
  );

  function goTo(n: number) {
    setFlipped(false);
    setGone(false);
    setError(null);
    setStep(n);
  }

  function typeExample() {
    if (typing) return;
    setTyping(true);
    setNote("");
    // Progress comes from elapsed time so a throttled timer can't stretch the animation.
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
    setTimeout(() => goTo(5), 650);
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
          page_title: "Lemma: your first capture",
          dictionary_definition: DEFINITION,
          encyclopedic_summary: WIKI,
          explanation: CONTEXT,
          user_note: note.trim() || null,
        }),
      );
    } catch {
      // storage blocked: they still get an account, just not the sample capture
    }
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) return setError("Those passwords don't match.");
    if (password.length < 6) return setError("Use a password of at least 6 characters.");
    setBusy(true);
    persistCapture();
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/app`,
        },
      });
      if (error) throw error;
      if (!data.session) {
        setCheckEmail(true); // "Confirm email" is on in Supabase
      } else {
        goTo(7);
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  const firstName = name.trim().split(/\s+/)[0];

  return (
    <main className="mx-auto flex min-h-screen max-w-[440px] flex-col px-6 pb-10 pt-6">
      <div className="flex h-9 items-center justify-between text-sm">
        {step > 0 && step < LAST ? (
          <button type="button" onClick={() => goTo(step - 1)} className="text-ink-soft hover:text-ink">
            &larr; Back
          </button>
        ) : (
          <Link href="/" className="font-serif text-lg italic text-ink">
            Lemma
          </Link>
        )}
        {step < LAST && (
          <Link href="/signup" className="text-ink-faint underline underline-offset-4 hover:text-ink">
            Skip setup
          </Link>
        )}
      </div>
      <Rail step={step} />

      <div key={step} className="ob-screen flex flex-1 flex-col justify-center gap-5 py-6">
        {/* 0 — welcome */}
        {step === 0 && (
          <>
            <p className="font-serif text-5xl italic text-ink">Lemma</p>
            <p className="font-serif text-2xl leading-snug text-ink">
              You read something worth keeping, and you save it.
              <br />
              Then it sits in a folder, and you forget it.
            </p>
            <p className="text-[15px] text-ink-soft">
              Lemma keeps the meaning, asks why it mattered to you, and brings it back until it sticks.
            </p>
            <div className="flex flex-col items-center gap-4 pt-2">
              <button className={primaryBtn} onClick={() => goTo(1)}>
                Show me how
              </button>
              <Link href="/login" className={textBtn}>
                I already have an account
              </Link>
            </div>
          </>
        )}

        {/* 1 — how capture actually works */}
        {step === 1 && (
          <>
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-faint">1 · Capture</p>
              <h2 className="mt-1 font-serif text-2xl text-ink">Save anything with a right-click.</h2>
            </div>
            <CaptureDemoPicker />
            <button className={primaryBtn} onClick={() => goTo(2)}>
              Next
            </button>
          </>
        )}

        {/* 2 — what you get back */}
        {step === 2 && (
          <>
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-faint">2 · What you get back</p>
              <h2 className="mt-1 font-serif text-2xl text-ink">The meaning, before you even ask.</h2>
            </div>
            <div className="rounded-2xl border border-line bg-paper-raised p-5 shadow-sm">
              <p className="font-serif text-3xl text-ink">{WORD}</p>
              <section className="mt-4">
                <h3 className="text-xs uppercase tracking-wide text-ink-faint">Definition</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-ink">{DEFINITION}</p>
              </section>
              <section className="mt-4">
                <h3 className="text-xs uppercase tracking-wide text-ink-faint">From Wikipedia</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{WIKI}</p>
              </section>
              <section className="mt-4">
                <h3 className="text-xs uppercase tracking-wide text-ink-faint">How it&rsquo;s used here</h3>
                <p className="explanation-scaffold mt-1">{CONTEXT}</p>
              </section>
            </div>
            <p className="text-sm text-ink-faint">Screenshots and links skip the lookup and go straight to your note.</p>
            <button className={primaryBtn} onClick={() => goTo(3)}>
              Next
            </button>
          </>
        )}

        {/* 3 — your note (skippable) */}
        {step === 3 && (
          <>
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-faint">3 · Your note</p>
              <h2 className="mt-1 font-serif text-2xl text-ink">Why did it matter to you?</h2>
              <p className="mt-1 text-[15px] text-ink-soft">
                This is the part Lemma tests you on. Skip it now and add one later if you&rsquo;d rather.
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
            <div className="grid grid-cols-2 gap-3">
              <button className={primaryBtn} disabled={!note.trim() || typing} onClick={() => goTo(4)}>
                Save it
              </button>
              <button
                className={secondaryBtn}
                disabled={typing}
                onClick={() => {
                  setNote("");
                  goTo(4);
                }}
              >
                Skip for now
              </button>
            </div>
          </>
        )}

        {/* 4 — it comes back (a screenshot card, to show review covers everything) */}
        {step === 4 && (
          <>
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-faint">4 · It comes back</p>
              <h2 className="mt-1 font-serif text-2xl text-ink">Every capture returns, not just words.</h2>
              <p className="mt-1 text-[15px] text-ink-soft">Here&rsquo;s a screenshot you saved. Tap it to see what you wrote.</p>
            </div>
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
                    <div className="h-28 overflow-hidden rounded-lg border border-line">
                      <ChartCard />
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-wide text-ink-faint">Screenshot</p>
                    <p className="text-sm text-ink-faint">Tap to flip</p>
                  </div>
                  <div className="ob-face back">
                    {note ? (
                      <>
                        <p className="text-xs uppercase tracking-wide text-ink-faint">You wrote</p>
                        <p className="note-artifact mt-3 font-serif text-lg leading-relaxed">{note}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs uppercase tracking-wide text-ink-faint">No note yet</p>
                        <p className="mt-2 text-sm text-ink-soft">
                          You skipped it, so Lemma shows the meaning instead. You can add a note any time.
                        </p>
                        <p className="mt-3 text-sm text-ink">{DEFINITION}</p>
                      </>
                    )}
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

        {/* 5 — spaces, shown properly */}
        {step === 5 && (
          <>
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-faint">5 · Spaces</p>
              <h2 className="mt-1 font-serif text-2xl text-ink">Share with a friend, a team or a whole organisation.</h2>
              <p className="mt-1 text-[15px] text-ink-soft">
                A space is a shared folder for any group. Invite people by email, then pick the space when you save, or
                move a capture into it later.
              </p>
            </div>
            <SpacesDemo />
            <button className={primaryBtn} onClick={() => goTo(6)}>
              Continue
            </button>
          </>
        )}

        {/* 6 — create account */}
        {step === 6 && (
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
                We sent a confirmation link to <span className="font-medium text-ink">{email}</span>. Click it, then
                sign in. Your first capture is saved on this device and will be added to your vault.
                <div className="mt-3">
                  <Link href="/login" className={textBtn}>
                    Go to sign in
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <GoogleButton label="Sign up with Google" onError={setError} beforeRedirect={persistCapture} />
                <Divider />
                <form onSubmit={signUp} className="space-y-3.5">
                  <Field id="ob-name" label="Your name" type="text" required autoComplete="name" placeholder="Aishika" value={name} onChange={(e) => setName(e.target.value)} />
                  <Field id="ob-email" label="Email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <Field id="ob-password" label="Password" type="password" required minLength={6} autoComplete="new-password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <Field id="ob-confirm" label="Confirm password" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                  <ErrorNote message={error} />
                  <SubmitButton busy={busy} busyLabel="Creating your vault…">
                    Create my vault
                  </SubmitButton>
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

        {/* 7 — done */}
        {step === 7 && (
          <>
            <svg className="ob-check" width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
              <circle cx="32" cy="32" r="30" fill="var(--accent)" />
              <path d="M19 33l9 9 17-19" stroke="var(--surface)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h2 className="font-serif text-3xl text-ink">{firstName ? `Welcome, ${firstName}.` : "Your vault is ready."}</h2>
            <ul className="divide-y divide-line border-y border-line text-[15px]">
              {[
                ["Capture", "Right-click a word, passage, screenshot, link or page."],
                ["Meaning", "Definition first, then how it's used, then your note."],
                ["It comes back", "Words come back for review; links and pages as a gentle reminder."],
                ["Spaces", "Share any capture with someone by email."],
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
