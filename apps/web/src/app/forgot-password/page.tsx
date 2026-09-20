"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, ErrorNote, Field, SubmitButton, friendlyError } from "@/components/AuthKit";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle={`If an account exists for ${email}, a reset link is on its way.`}>
        <p className="text-[15px] text-ink-soft">
          The link opens a page where you choose a new password. It can take a minute to arrive, so check spam too.
        </p>
        <div className="mt-6 text-sm">
          <Link href="/login" className="font-medium text-ink underline underline-offset-4">
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link."
      footer={
        <Link href="/login" className="underline underline-offset-4">
          &larr; Back to sign in
        </Link>
      }
    >
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
        <ErrorNote message={error} />
        <SubmitButton busy={busy} busyLabel="Sending…">
          Send reset link
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
