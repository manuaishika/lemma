// SM-2 spaced repetition. Pure functions, no I/O.
// Constants are fixed by the product brief -- do not tune them:
//   ease delta per grade:  Again -0.20  Hard -0.15  Good 0  Easy +0.15
//   Again is the only lapse (reps -> 0, back in 1 day); Hard/Good/Easy all advance.
//   The next interval uses the ease *before* this review's delta is applied.

import type { Grade } from "./types.js";

export const MIN_EASE = 1.3;
export const DEFAULT_EASE = 2.5;

export interface CardState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
}

export interface ReviewOutcome extends CardState {
  dueAt: Date;
}

const EASE_DELTA: Record<Grade, number> = { 0: -0.2, 1: -0.15, 2: 0, 3: 0.15 };

const DAY_MS = 86_400_000;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Advance a card by one review.
 *
 * @param card  current ease / interval / repetition count
 * @param grade the user's grade for this review
 * @param now   review timestamp (defaults to current time); dueAt is derived from it
 */
export function review(card: CardState, grade: Grade, now: Date = new Date()): ReviewOutcome {
  let { repetitions, intervalDays } = card;

  if (grade === 0) {
    // Lapse: reset the streak, see it again tomorrow.
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * card.easeFactor);
    repetitions += 1;
  }

  const easeFactor = Math.max(MIN_EASE, round2(card.easeFactor + EASE_DELTA[grade]));

  return {
    easeFactor,
    intervalDays,
    repetitions,
    dueAt: new Date(now.getTime() + intervalDays * DAY_MS),
  };
}

/** Preview the resulting interval for every grade — used to label the review buttons. */
export function previewIntervals(card: CardState): Record<Grade, number> {
  return {
    0: review(card, 0).intervalDays,
    1: review(card, 1).intervalDays,
    2: review(card, 2).intervalDays,
    3: review(card, 3).intervalDays,
  };
}

export function freshCard(): CardState {
  return { easeFactor: DEFAULT_EASE, intervalDays: 0, repetitions: 0 };
}
