"use client";

import { useEffect, useRef, useState } from "react";
import { HoverTabs, TabIcon, useAutoCycle, type TabIconName } from "@/components/HoverTabs";

type Item = { kind: "word" | "screenshot" | "link" | "passage" | "page"; title: string; by: string };

const SCENARIOS: {
  id: string;
  tab: string;
  icon: TabIconName;
  space: string;
  email: string;
  members: string[];
  extra: number;
  feed: Item[];
}[] = [
  {
    id: "group",
    tab: "Study group",
    icon: "group",
    space: "Econ 201 study group",
    email: "maya@uni.edu",
    members: ["Maya", "Alex", "Sam"],
    extra: 0,
    feed: [
      { kind: "word", title: "arbitrage", by: "Maya" },
      { kind: "screenshot", title: "Supply and demand curve", by: "Alex" },
      { kind: "link", title: "Lecture 4 slides", by: "Sam" },
    ],
  },
  {
    id: "team",
    tab: "Team",
    icon: "team",
    space: "Design team reading list",
    email: "jo@studio.co",
    members: ["Jo", "Priya", "Lee", "Omar"],
    extra: 0,
    feed: [
      { kind: "link", title: "Gestalt principles, explained", by: "Priya" },
      { kind: "passage", title: "“Constraints breed creativity…”", by: "Jo" },
      { kind: "page", title: "How Linear ships design", by: "Omar" },
    ],
  },
  {
    id: "org",
    tab: "Organisation",
    icon: "org",
    space: "Acme Inc. Research",
    email: "dana@acme.com",
    members: ["Dana", "Ken", "Ola"],
    extra: 37,
    feed: [
      { kind: "screenshot", title: "Q3 churn by cohort", by: "Ken" },
      { kind: "page", title: "Competitor pricing teardown", by: "Ola" },
      { kind: "word", title: "net revenue retention", by: "Dana" },
    ],
  },
];

const CYCLE_MS = 10500;
const AVATAR = ["var(--accent)", "var(--blue)", "var(--amber)", "var(--red)"];

/**
 * The Spaces flow for a group of any size: name a space, invite by email, people join,
 * and everything shows who shared it. It plays each scenario on its own, then moves on;
 * hover a tab to jump to it. Timer-driven, and it waits until scrolled into view.
 */
export function SpacesDemo() {
  const root = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const cycle = useAutoCycle(SCENARIOS.length, CYCLE_MS, started);
  const s = SCENARIOS[cycle.index]!;

  const [name, setName] = useState("");
  const [mail, setMail] = useState("");
  const [stage, setStage] = useState(0); // 0 naming · 1 inviting · 2 invited
  const [pressed, setPressed] = useState(false);
  const [members, setMembers] = useState(0);
  const [extraShown, setExtraShown] = useState(false);
  const [feed, setFeed] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setStarted(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    setName("");
    setMail("");
    setStage(0);
    setPressed(false);
    setMembers(0);
    setExtraShown(false);
    setFeed(0);

    if (cycle.reduced) {
      // no motion: show the finished state
      setName(s.space);
      setMail(s.email);
      setStage(2);
      setMembers(s.members.length);
      setExtraShown(true);
      setFeed(s.feed.length);
      return;
    }

    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    const type = (text: string, set: (v: string) => void, start: number, per: number) => {
      for (let i = 1; i <= text.length; i++) at(start + i * per, () => set(text.slice(0, i)));
      return start + text.length * per;
    };

    const nameDone = type(s.space, setName, 300, 38);
    at(nameDone + 300, () => setStage(1));
    const mailDone = type(s.email, setMail, nameDone + 700, 42);
    at(mailDone + 350, () => setPressed(true));
    at(mailDone + 600, () => {
      setPressed(false);
      setStage(2);
    });
    let t = mailDone + 1100;
    s.members.forEach((_, i) => {
      at(t + i * 380, () => setMembers(i + 1));
    });
    t += s.members.length * 380;
    if (s.extra) at(t, () => setExtraShown(true));
    t += 500;
    s.feed.forEach((_, i) => at(t + i * 520, () => setFeed(i + 1)));

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [started, cycle.index, cycle.reduced, s]);

  const total = 1 + members + (extraShown ? s.extra : 0);

  return (
    <div ref={root}>
      <div className="mb-3">
        <HoverTabs
          label="Who is it for?"
          items={SCENARIOS.map((x) => ({ id: x.id, label: x.tab, icon: x.icon }))}
          active={cycle.index}
          hold={cycle.hold}
          cycleMs={CYCLE_MS}
          onEnter={cycle.enter}
          onLeave={cycle.leave}
          onPick={cycle.pick}
        />
      </div>

      <div className="sd" style={{ minHeight: 318 }}>
        <div className="sd-head">
          <span>{name || "New space"}</span>
          <span className="sd-badge">
            {total} {total === 1 ? "person" : "people"}
          </span>
        </div>

        <div className="sd-body">
          <div className="sd-label">Space name</div>
          <div className="sd-input">
            {name}
            {stage === 0 && <b className="sd-caret" />}
          </div>

          {stage >= 1 && (
            <div className="sd-rise">
              <div className="sd-label">Invite by email</div>
              <div className="sd-row">
                <div className="sd-input sd-grow">
                  {mail}
                  {stage === 1 && <b className="sd-caret" />}
                </div>
                <div className={`sd-btn ${pressed ? "pressed" : ""}`}>Invite</div>
              </div>
            </div>
          )}

          {stage >= 2 && members === 0 && (
            <div className="sd-pending sd-rise">
              <span>{s.email}</span>
              <span className="sd-tag">invited</span>
            </div>
          )}

          {members > 0 && (
            <div className="sd-members">
              <span className="sd-av" style={{ "--av": "var(--ink-soft)" } as React.CSSProperties}>
                You
              </span>
              {s.members.slice(0, members).map((m, i) => (
                <span key={m} className="sd-av" style={{ "--av": AVATAR[i % AVATAR.length] } as React.CSSProperties} title={m}>
                  {m[0]}
                </span>
              ))}
              {extraShown && <span className="sd-more sd-rise">+{s.extra} more</span>}
            </div>
          )}

          {feed > 0 && (
            <div className="sd-feed">
              {s.feed.slice(0, feed).map((it) => (
                <div key={it.title} className="sd-item">
                  <TabIcon name={it.kind === "word" ? "word" : it.kind} />
                  <span className="sd-grow2">
                    <span className="sd-title">{it.title}</span>
                    <span className="sd-by">Shared by {it.by}</span>
                  </span>
                  <span className="sd-kind">{it.kind === "passage" ? "passage" : it.kind}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
