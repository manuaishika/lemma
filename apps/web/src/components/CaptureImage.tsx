"use client";

import { useEffect, useState } from "react";

/** Fetches a short-lived signed URL for a screenshot capture and renders it. */
export function CaptureImage({ id, alt }: { id: string; alt: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/captures/${id}/image`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) setSrc(data.url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (failed) {
    return <div className="mt-3 rounded-md bg-line opacity-60 p-6 text-center text-sm text-ink-faint">Image unavailable</div>;
  }
  if (!src) {
    return <div className="mt-3 h-40 animate-pulse rounded-md bg-line opacity-60" />;
  }
  // eslint-disable-next-line @next/next/no-img-element -- signed URL, not a static asset
  return <img src={src} alt={alt} className="mt-3 max-h-96 w-full rounded-md border border-line object-contain" />;
}
