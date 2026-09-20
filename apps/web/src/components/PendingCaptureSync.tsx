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
        // Only clear it once it's really saved; any failure leaves it for the next visit.
        if (res.ok) {
          try {
            localStorage.removeItem(PENDING_ONBOARDING_KEY);
          } catch {}
          router.refresh();
        }
      })
      .catch(() => {});
  }, [router]);

  return null;
}
