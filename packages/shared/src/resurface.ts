import type { CaptureType, Resurface } from "./types.js";

/**
 * How a capture comes back, chosen for you from what it is:
 *  - words, phrases and screenshots (formulas, diagrams) are things to know -> graded review
 *  - passages, links and pages are things to read -> a gentle reminder, no grading
 * A capture can override this later; `resurface` is null until someone does.
 */
export function defaultResurface(type: CaptureType): Resurface {
  return type === "term" || type === "screenshot" ? "review" : "revisit";
}

export function effectiveResurface(c: { capture_type: CaptureType; resurface?: Resurface | null }): Resurface {
  return c.resurface ?? defaultResurface(c.capture_type);
}
