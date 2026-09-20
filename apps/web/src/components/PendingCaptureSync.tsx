"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export const PENDING_ONBOARDING_KEY = "lemma_onboarding_capture";

/**
 * Onboarding lets people capture a sample word before they have an account.
 * That capture waits in localStorage; the first time they land in the app
 * signed in, save it for real so the "waiting in your vault" promise is true.
 */
export function PendingCaptureSync() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    let raw: string | null = null;
    try {
      raw = localStorage.getItem(PENDING_ONBOARDING_KEY);
    } catch {
      return;
    }
    if (!raw) return;

    fetch("/api/captures", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: raw,
    })
      .then((res) => {
        // Keep it on network/server errors so a later visit retries; drop it
        // on success or if the API says the payload itself is bad.
        if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 401)) {
          try {
            localStorage.removeItem(PENDING_ONBOARDING_KEY);
          } catch {}
          if (res.ok) router.refresh();
        }
      })
      .catch(() => {});
  }, [router]);

  return null;
}
