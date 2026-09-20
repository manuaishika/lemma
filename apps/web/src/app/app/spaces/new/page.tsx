"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewSpacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/spaces", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not create the space");
      return;
    }
    const { space } = await res.json();
    router.push(`/app/spaces/${space.id}/settings`);
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">New space</h1>
      <p className="mt-2 text-sm text-ink-soft">
        A shared folder — invite someone by email, both of you add captures, everyone sees them on
        refresh. No live editing.
      </p>
      <form onSubmit={submit} className="mt-6 flex max-w-sm gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Space name"
          className="flex-1 rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-paper-raised hover:bg-accent-soft disabled:opacity-50"
        >
          Create
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-red">{error}</p>}
    </div>
  );
}
