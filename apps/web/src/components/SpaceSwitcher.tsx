"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Space } from "@lemma/shared";

export function SpaceSwitcher({ spaces }: { spaces: Space[] }) {
  const router = useRouter();
  const current = useSearchParams().get("space") ?? "";

  return (
    <div className="flex items-center gap-2">
      <select
        value={current}
        onChange={(e) => router.push(e.target.value ? `/app?space=${e.target.value}` : "/app")}
        className="rounded-md border border-line bg-paper-raised px-2 py-1 text-sm text-ink-soft outline-none focus:border-accent"
      >
        <option value="">My Vault</option>
        {spaces.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <Link href="/app/spaces/new" className="text-sm text-ink-faint underline underline-offset-4">
        + Space
      </Link>
      {current && (
        <Link
          href={`/app/spaces/${current}/settings`}
          className="text-sm text-ink-faint underline underline-offset-4"
        >
          Settings
        </Link>
      )}
    </div>
  );
}
