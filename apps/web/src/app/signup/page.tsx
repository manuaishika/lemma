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

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(params.get("error"));
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) return setError("Those passwords don't match.");
    if (password.length < 6) return setError("Use a password of at least 6 characters.");

    setBusy(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
      if (!data.session) {
        // "Confirm email" is on in Supabase: no session until the link is clicked.
        setCheckEmail(true);
        setBusy(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  if (checkEmail) {
    return (
      <AuthShell title="Check your email" subtitle={`We sent a confirmation link to ${email}.`}>
        <p className="text-[15px] text-ink-soft">
          Click the link, then come back and sign in. It can take a minute to arrive, so check spam too.
        </p>
        <div className="mt-6 flex items-center gap-5 text-sm">
          <Link href="/login" className="font-medium text-ink underline underline-offset-4">
            Go to sign in
          </Link>
          <button onClick={() => setCheckEmail(false)} className="text-ink-soft underline underline-offset-4">
            Use a different email
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Save anything you read. Come back to it until it sticks."
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-ink underline underline-offset-4">
            Sign in
          </Link>
        </p>
      }
    >
      <GoogleButton next={next} label="Sign up with Google" onError={setError} />
      <Divider />
      <form onSubmit={submit} className="space-y-4">
        <Field
          id="name"
          label="Your name"
          type="text"
          required
          autoComplete="name"
          placeholder="Aishika"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
        <Field
          id="password"
          label="Password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Field
          id="confirm"
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <ErrorNote message={error} />
        <SubmitButton busy={busy} busyLabel="Creating your account…">
          Create account
        </SubmitButton>
      </form>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
