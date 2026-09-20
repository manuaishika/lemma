"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useGoogleEnabled } from "@/lib/useGoogleEnabled";

/** Only same-site relative paths — never bounce a user to an arbitrary URL. */
export function safeNext(raw: string | null | undefined, fallback = "/app"): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}

/** Turn Supabase / network failures into something a person can act on. */
export function friendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  console.error("[auth]", err);
  if (err instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(message)) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Please confirm your email first. Check your inbox for the link.";
  }
  if (/already registered|already been registered/i.test(message)) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (/invalid login credentials/i.test(message)) {
    return "That email and password don't match.";
  }
  return message || "Something went wrong. Please try again.";
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col px-6 py-8">
      <header className="flex items-center justify-between">
        <Link href="/" className="font-serif text-2xl italic text-ink" aria-label="Lemma home">
          Lemma
        </Link>
        <Link href="/" className="text-sm text-ink-soft hover:text-ink">
          &larr; Back to home
        </Link>
      </header>
      <div className="ob-screen flex flex-1 flex-col justify-center py-10">
        <div>
          <h1 className="font-serif text-3xl text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-[15px] text-ink-soft">{subtitle}</p>}
        </div>
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-6 text-sm text-ink-soft">{footer}</div>}
      </div>
    </main>
  );
}

const inputClass =
  "w-full rounded-xl border border-line bg-paper-raised px-4 py-3 text-[15px] text-ink outline-none transition focus:border-accent";

export function Field({
  id,
  label,
  ...props
}: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <input id={id} name={id} className={inputClass} {...props} />
    </div>
  );
}

export function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

export function SubmitButton({
  busy,
  children,
  busyLabel,
}: {
  busy: boolean;
  children: React.ReactNode;
  busyLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="press flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-[15px] font-medium text-paper-raised hover:bg-accent-soft"
    >
      {busy ? (
        <>
          <Spinner /> {busyLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg border border-red/40 bg-paper-warm px-3 py-2 text-sm text-red">
      {message}
    </p>
  );
}

export function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-ink-faint">
      <span className="h-px flex-1 bg-line" />
      or
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/**
 * Always visible. If the provider isn't enabled in Supabase yet we say so
 * instead of sending people to a raw JSON error page.
 */
export function GoogleButton({
  next = "/app",
  label = "Continue with Google",
  onError,
  beforeRedirect,
}: {
  next?: string;
  label?: string;
  onError: (message: string) => void;
  beforeRedirect?: () => void;
}) {
  const enabled = useGoogleEnabled();
  const [busy, setBusy] = useState(false);

  async function go() {
    if (!enabled) {
      onError("Google sign-in isn't switched on yet. Please use your email and password for now.");
      return;
    }
    setBusy(true);
    try {
      beforeRedirect?.();
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (error) throw error;
    } catch (err) {
      onError(friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={go}
      disabled={busy}
      className="press flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-paper-raised px-5 py-3 text-[15px] font-medium text-ink"
    >
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
        <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.3 6.5v5.4h7c4.1-3.8 6.6-9.4 6.6-15.9z" />
        <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7-5.4c-2 1.3-4.5 2.1-7.5 2.1-5.8 0-10.7-3.9-12.4-9.2H4.4v5.6C8 41.1 15.4 46 24 46z" />
        <path fill="#FBBC05" d="M11.6 28.2c-.4-1.3-.7-2.7-.7-4.2s.3-2.9.7-4.2v-5.6H4.4C2.9 17.2 2 20.5 2 24s.9 6.8 2.4 9.8l7.2-5.6z" />
        <path fill="#EA4335" d="M24 10.6c3.3 0 6.2 1.1 8.5 3.3l6.4-6.4C34.9 3.9 29.9 2 24 2 15.4 2 8 6.9 4.4 14.2l7.2 5.6c1.7-5.3 6.6-9.2 12.4-9.2z" />
      </svg>
      {busy ? "Opening Google…" : label}
    </button>
  );
}
