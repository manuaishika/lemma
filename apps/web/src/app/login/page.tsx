"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AuthShell,
  Divider,
  ErrorNote,
  Field,
  GoogleButton,
  SubmitButton,
  friendlyError,
  safeNext,
} from "@/components/AuthKit";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(params.get("error"));
  const [busy, setBusy] = useState(false);
  const reset = params.get("reset") === "1";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your vault."
      footer={
        <p>
          New to Lemma?{" "}
          <Link href="/signup" className="font-medium text-ink underline underline-offset-4">
            Create an account
          </Link>
        </p>
      }
    >
      {reset && (
        <p className="mb-4 rounded-lg bg-accent-light px-3 py-2 text-sm text-ink">
          Password updated. Sign in with your new password.
        </p>
      )}
      <GoogleButton next={next} onError={setError} />
      <Divider />
      <form onSubmit={submit} className="space-y-4">
        <Field
          id="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div>
          <Field
            id="password"
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="mt-1.5 text-right">
            <Link href="/forgot-password" className="text-sm text-ink-soft underline underline-offset-4 hover:text-ink">
              Forgot password?
            </Link>
          </div>
        </div>
        <ErrorNote message={error} />
        <SubmitButton busy={busy} busyLabel="Signing in…">
          Sign in
        </SubmitButton>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
