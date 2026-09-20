"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tabs that play themselves: they advance every `cycleMs`, jump the moment you hover
 * (or focus) one, hold while you're on them, and carry on shortly after you leave.
 * A tap on touch screens holds for 15s. Reduced motion turns the auto-advance off.
 */
export function useAutoCycle(count: number, cycleMs: number, enabled = true) {
  const [index, setIndex] = useState(0);
  const [hold, setHold] = useState(false);
  const [reduced, setReduced] = useState(false);
  const release = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    return () => {
      if (release.current) clearTimeout(release.current);
    };
  }, []);

  useEffect(() => {
    if (!enabled || hold || reduced) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), cycleMs);
    return () => clearTimeout(t);
  }, [index, hold, reduced, enabled, count, cycleMs]);

  const enter = useCallback((i: number) => {
    setIndex(i);
    setHold(true);
    if (release.current) clearTimeout(release.current);
  }, []);
  const leave = useCallback(() => {
    if (release.current) clearTimeout(release.current);
    release.current = setTimeout(() => setHold(false), 1500);
  }, []);
  const pick = useCallback((i: number) => {
    setIndex(i);
    setHold(true);
    if (release.current) clearTimeout(release.current);
    release.current = setTimeout(() => setHold(false), 15000);
  }, []);

  return { index, hold, reduced, enter, leave, pick };
}

export type TabIconName = "word" | "passage" | "screenshot" | "link" | "page" | "group" | "team" | "org";

export function TabIcon({ name, size = 16 }: { name: TabIconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "word":
      return (
        <svg {...common}>
          <text x="0.5" y="12.5" fontSize="11.5" fontFamily="Georgia, serif" fontWeight="600" fill="currentColor" stroke="none">
            Aa
          </text>
        </svg>
      );
    case "passage":
      return (
        <svg {...common}>
          <path d="M2 4h12M2 8h12M2 12h8" />
        </svg>
      );
    case "screenshot":
      return (
        <svg {...common}>
          <path d="M2 5V2h3M11 2h3v3M14 11v3h-3M5 14H2v-3" />
          <path d="M6 6h4v4H6z" />
        </svg>
      );
    case "link":
      return (
        <svg {...common}>
          <path d="M6.7 9.3l2.6-2.6" />
          <path d="M8.6 4.6l.9-.9a2.5 2.5 0 013.5 3.5l-.9.9" />
          <path d="M7.4 11.4l-.9.9a2.5 2.5 0 01-3.5-3.5l.9-.9" />
        </svg>
      );
    case "page":
      return (
        <svg {...common}>
          <path d="M4 2h5l3 3v9H4z" />
          <path d="M9 2v3h3" />
        </svg>
      );
    case "group":
      return (
        <svg {...common}>
          <circle cx="6" cy="5.5" r="2.2" />
          <circle cx="11.5" cy="6.5" r="1.7" />
          <path d="M2 13c0-2.4 1.8-4 4-4s4 1.6 4 4M10.5 9.6c2 0 3.5 1.1 3.5 3.4" />
        </svg>
      );
    case "team":
      return (
        <svg {...common}>
          <circle cx="8" cy="5" r="2.1" />
          <circle cx="3.2" cy="7" r="1.5" />
          <circle cx="12.8" cy="7" r="1.5" />
          <path d="M4.6 14c0-2.4 1.5-4 3.4-4s3.4 1.6 3.4 4" />
        </svg>
      );
    case "org":
      return (
        <svg {...common}>
          <path d="M2 14h12M3.5 14V3h6v11M9.5 6.5h3V14" />
          <path d="M5.5 5.5h2M5.5 8h2M5.5 10.5h2" />
        </svg>
      );
  }
}

export function HoverTabs({
  items,
  active,
  hold,
  cycleMs,
  label,
  onEnter,
  onLeave,
  onPick,
}: {
  items: { id: string; label: string; icon: TabIconName }[];
  active: number;
  hold: boolean;
  cycleMs: number;
  label: string;
  onEnter: (i: number) => void;
  onLeave: () => void;
  onPick: (i: number) => void;
}) {
  return (
    <div
      className="htabs"
      role="tablist"
      aria-label={label}
      onMouseLeave={onLeave}
      style={{ "--cycle": `${cycleMs}ms` } as React.CSSProperties}
    >
      {items.map((it, i) => (
        <button
          key={it.id}
          type="button"
          role="tab"
          aria-selected={i === active}
          className={`htab ${i === active ? "on" : ""}`}
          onMouseEnter={() => onEnter(i)}
          onFocus={() => onEnter(i)}
          onBlur={onLeave}
          onClick={() => onPick(i)}
        >
          <TabIcon name={it.icon} />
          <span>{it.label}</span>
          {i === active && <i key={`${active}-${hold}`} className={`htab-bar ${hold ? "hold" : ""}`} />}
        </button>
      ))}
    </div>
  );
}
