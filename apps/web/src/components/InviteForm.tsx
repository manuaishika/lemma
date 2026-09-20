"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InviteForm({ spaceId }: { spaceId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "error" | "done">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("busy");
    const res = await fetch(`/api/spaces/${spaceId}/members`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      const body = await res.json().catch(() => ({}));
      setMessage(
        body.pending
          ? body.emailed
            ? "Invite emailed — they'll join when they sign up."
            : "Invite saved — they'll join when they sign up with that email."
          : "Added",
      );
      setStatus("done");
      setEmail("");
      router.refresh();
      setTimeout(() => setStatus("idle"), 4000);
    } else {
      const body = await res.json().catch(() => ({}));
      setMessage(body.error || "Could not add that person");
      setStatus("error");
    }
  }

  return (
    <div className="max-w-sm">
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="their@email.com"
          className="flex-1 rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={status === "busy"}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-paper-raised hover:bg-accent-soft disabled:opacity-50"
        >
          Invite
        </button>
      </form>
      {status === "error" && <p className="mt-2 text-sm text-red">{message}</p>}
      {status === "done" && <p className="mt-2 text-sm text-accent">{message}</p>}
    </div>
  );
}
