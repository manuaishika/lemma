/**
 * Boil a long definition down to one short line: first sentence only, and if that is
 * still longer than `max`, stop at the last natural clause break (a comma, semicolon,
 * dash or colon) rather than chopping mid-thought. Falls back to a word boundary with
 * an ellipsis only when there is no clause break to use.
 */
export function shorten(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  const first = t.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? t;
  const s = first.length >= 30 ? first : t; // don't keep a stub like "Mr."
  if (s.length <= max) return s;

  const head = s.slice(0, max);
  // A dash, semicolon or colon is a stronger break than a comma, so prefer those.
  const strong = Math.max(head.lastIndexOf("; "), head.lastIndexOf(": "), head.lastIndexOf(" – "), head.lastIndexOf(" — "));
  const clause = strong >= 50 ? strong : head.lastIndexOf(", ");
  if (clause >= 50) return head.slice(0, clause).replace(/[,;:–—\s]+$/, "") + ".";

  const word = head.lastIndexOf(" ");
  return head.slice(0, word > 0 ? word : max).replace(/[,;:(\-–—\s]+$/, "") + "…";
}
