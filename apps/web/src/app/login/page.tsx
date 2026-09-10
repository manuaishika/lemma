"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/app";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function signInWithGoogle() {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${next}` },
    });
    if (error) setError(error.message);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setError(error.message);
      router.push(next);
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) return setError(error.message);
    if (!data.session) {
      // Project has "Confirm email" on — no session until the link is clicked.
      setCheckEmail(true);
      return;
    }
    router.push(next);
    router.refresh();
  }

  if (checkEmail) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
        <p className="font-serif text-sm italic text-ink-faint">Lemma</p>
        <h1 className="mt-3 font-serif text-2xl text-ink">Check your email</h1>
        <p className="mt-4 text-sm text-ink-soft">
          We sent a confirmation link to <span className="font-medium">{email}</span>. Click it,
          then come back and sign in.
        </p>
        <button
          onClick={() => setCheckEmail(false)}
          className="mt-6 text-sm text-ink-faint underline underline-offset-4"
        >
          Back
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <p className="font-serif text-sm italic text-ink-faint">Lemma</p>
      <h1 className="mt-3 font-serif text-2xl text-ink">
        {mode === "signin" ? "Sign in" : "Create your vault"}
      </h1>

      <button
        onClick={signInWithGoogle}
        type="button"
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-md border border-line bg-paper-raised px-4 py-2 text-sm font-medium text-ink transition hover:border-accent"
      >
        Continue with Google
      </button>

      <div className="mt-6 flex items-center gap-3 text-xs text-ink-faint">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-accent"
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-paper-raised transition hover:bg-accent-soft disabled:opacity-60"
        >
          {busy ? "…" : mode === "signin" ? "Sign in" : "Sign up"}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="mt-4 text-sm text-ink-soft underline underline-offset-4"
      >
        {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
      </button>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
