"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, ErrorNote, Field, SubmitButton, friendlyError } from "@/components/AuthKit";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState<"checking" | "yes" | "no">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // /auth/callback exchanged the emailed code for a recovery session before landing here.
  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data }) => setReady(data.session ? "yes" : "no"))
      .catch(() => setReady("no"));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) return setError("Those passwords don't match.");
    if (password.length < 6) return setError("Use a password of at least 6 characters.");
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      router.push("/login?reset=1");
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  if (ready === "no") {
    return (
      <AuthShell title="This link has expired" subtitle="Reset links only work once and for a short time.">
        <Link href="/forgot-password" className="text-sm font-medium text-ink underline underline-offset-4">
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={submit} className="space-y-4">
        <Field
          id="password"
          label="New password"
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
          label="Confirm new password"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <ErrorNote message={error} />
        <SubmitButton busy={busy || ready === "checking"} busyLabel={ready === "checking" ? "Checking link…" : "Saving…"}>
          Update password
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
