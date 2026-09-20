"use client";

import { useEffect, useState } from "react";

/**
 * True once the Google provider is enabled in Supabase (Auth → Providers).
 * Reads the project's public auth settings, so no env flag or redeploy is needed.
 */
export function useGoogleEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;
    fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => setEnabled(Boolean(s?.external?.google)))
      .catch(() => {});
  }, []);

  return enabled;
}
