import { describe, expect, it } from "vitest";
import { DEFAULT_EASE, MIN_EASE, freshCard, previewIntervals, review } from "./sm2.js";

const NOW = new Date("2026-01-01T00:00:00.000Z");
const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86_400_000);

describe("review", () => {
  it("first successful review schedules 1 day out", () => {
    const out = review(freshCard(), 2, NOW);
    expect(out.repetitions).toBe(1);
    expect(out.intervalDays).toBe(1);
    expect(daysBetween(NOW, out.dueAt)).toBe(1);
  });

  it("second successful review schedules 6 days out", () => {
    const out = review({ easeFactor: DEFAULT_EASE, intervalDays: 1, repetitions: 1 }, 2, NOW);
    expect(out.repetitions).toBe(2);
    expect(out.intervalDays).toBe(6);
  });

  it("third+ review compounds by the ease factor", () => {
    const out = review({ easeFactor: 2.5, intervalDays: 6, repetitions: 2 }, 2, NOW);
    expect(out.repetitions).toBe(3);
    expect(out.intervalDays).toBe(15); // round(6 * 2.5)
  });

  it("Again resets the streak and reschedules for tomorrow", () => {
    const out = review({ easeFactor: 2.5, intervalDays: 30, repetitions: 5 }, 0, NOW);
    expect(out.repetitions).toBe(0);
    expect(out.intervalDays).toBe(1);
  });

  it("Easy raises ease, Good keeps it, Hard lowers it", () => {
    const base = { easeFactor: 2.5, intervalDays: 6, repetitions: 2 };
    expect(review(base, 3, NOW).easeFactor).toBeGreaterThan(2.5);
    expect(review(base, 2, NOW).easeFactor).toBeCloseTo(2.5, 5);
    expect(review(base, 1, NOW).easeFactor).toBeLessThan(2.5);
  });

  it("ease never drops below the floor", () => {
    let card = freshCard();
    for (let i = 0; i < 20; i++) card = { ...card, ...review(card, 0, NOW) };
    expect(card.easeFactor).toBe(MIN_EASE);
  });

  it("Again keeps lowering ease even though the interval is fixed at 1", () => {
    const out = review({ easeFactor: 2.5, intervalDays: 1, repetitions: 0 }, 0, NOW);
    expect(out.easeFactor).toBeLessThan(2.5);
    expect(out.intervalDays).toBe(1);
  });
});

describe("brief constants", () => {
  it("applies the exact ease delta per grade from a 2.5 card", () => {
    const base = { easeFactor: 2.5, intervalDays: 6, repetitions: 2 };
    expect(review(base, 0, NOW).easeFactor).toBe(2.3);
    expect(review(base, 1, NOW).easeFactor).toBe(2.35);
    expect(review(base, 2, NOW).easeFactor).toBe(2.5);
    expect(review(base, 3, NOW).easeFactor).toBe(2.65);
  });

  it("computes the next interval from the ease *before* the delta", () => {
    const base = { easeFactor: 2.5, intervalDays: 6, repetitions: 2 };
    // Easy would give round(6 * 2.65) = 16 if the new ease were used; the brief says 15.
    expect(review(base, 3, NOW).intervalDays).toBe(15);
    expect(review(base, 1, NOW).intervalDays).toBe(15);
  });

  it("Hard is not a lapse", () => {
    const out = review({ easeFactor: 2.5, intervalDays: 6, repetitions: 2 }, 1, NOW);
    expect(out.repetitions).toBe(3);
  });
});

describe("previewIntervals", () => {
  it("returns an interval for every grade", () => {
    const preview = previewIntervals({ easeFactor: 2.5, intervalDays: 10, repetitions: 3 });
    expect(preview[0]).toBe(1);
    expect(preview[3]).toBeGreaterThanOrEqual(preview[2]);
    expect(preview[2]).toBeGreaterThanOrEqual(preview[1]);
  });
});
