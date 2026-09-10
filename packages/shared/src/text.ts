// Small text helpers shared by the extension popup and the web app.
// Ported from the original Word Vault popup.js.

export function normalizeSelection(text: string): string {
  return (text || "").replace(/\s+/g, " ").trim();
}

/**
 * Classifies a text selection only — screenshot/link captures are chosen
 * explicitly by how they're captured, not inferred from length.
 * 1 token -> "term", more than 1 -> "note". Deterministic on purpose.
 */
export function classifyCaptureType(text: string): "term" | "note" {
  const normalized = normalizeSelection(text);
  if (!normalized) return "term";
  return normalized.split(/\s+/).filter(Boolean).length === 1 ? "term" : "note";
}

export function buildDisplayTitle(text: string, captureType: "term" | "note"): string {
  const normalized = normalizeSelection(text);
  if (captureType !== "note") return normalized;
  return normalized.length > 78 ? `${normalized.slice(0, 78).trim()}…` : normalized;
}

/** The sentence containing `selection` within `block` text, else the trimmed block. */
export function enclosingSentence(blockText: string, selection: string): string {
  const clean = (blockText || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const target = normalizeSelection(selection);
  const sentences = clean.match(/[^.!?]+[.!?]*/g) ?? [clean];
  const hit = sentences.find((s) => target && s.includes(target));
  return (hit ?? clean).trim();
}
