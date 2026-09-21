import Anthropic from "@anthropic-ai/sdk";
import type { ExplainInput, ExplainResult } from "@lemma/shared";

// Cost-effective default; override with LEMMA_EXPLAIN_MODEL.
const MODEL = process.env.LEMMA_EXPLAIN_MODEL || "claude-haiku-4-5";

const anthropic = new Anthropic();

/**
 * A context-aware explanation: what the word means *as used in this passage /
 * domain*, not a generic dictionary gloss. Recessive scaffolding — the user's
 * own note is the artifact — so keep it to ~2 sentences.
 */
async function claudeExplanation(input: ExplainInput): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const context = [
    input.sentence && `Sentence: "${input.sentence}"`,
    input.page_title && `Page: ${input.page_title}`,
    input.source_url && `URL: ${input.source_url}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 220,
      system:
        "You explain a word or phrase as it is used in a specific passage. " +
        "Give the sense that fits this context and domain, not a general dictionary definition. " +
        "Two sentences maximum. Plain, direct language. No preamble, no quotes around the word.",
      messages: [
        {
          role: "user",
          content: `Word or phrase: ${input.text}\n${context || "(no surrounding context provided)"}`,
        },
      ],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return text || null;
  } catch (err) {
    console.error("claudeExplanation failed:", err);
    return null;
  }
}

/** Objective dictionary definition (free, no key). Shown first, at full strength. */
async function dictionaryDefinition(text: string): Promise<string | null> {
  // Both sources in parallel; dictionaryapi.dev is free but flaky, Wiktionary backs it up.
  const [primary, backup] = await Promise.all([dictionaryApiDefinition(text), wiktionaryDefinition(text)]);
  return primary ?? backup;
}

/** First sentence only, capped at `max` characters on a word boundary. */
function shorten(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  const first = t.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? t;
  const s = first.length >= 30 ? first : t; // don't keep a stub like "Mr."
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:(\-\s]+$/, "") + "…";
}

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };

/** Wiktionary's REST definition endpoint (same Wikimedia infrastructure as Wikipedia). */
async function wiktionaryDefinition(text: string): Promise<string | null> {
  const term = text.trim();
  if (!term || term.length < 2 || /\s/.test(term)) return null;
  try {
    const res = await fetch(
      `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(term.toLowerCase())}`,
      { headers: { "user-agent": "Lemma/1.0 (reading-notes app)", accept: "application/json" }, signal: AbortSignal.timeout(4000) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      en?: Array<{ partOfSpeech?: string; definitions?: Array<{ definition?: string }> }>;
    };
    for (const entry of data.en ?? []) {
      for (const d of entry.definitions ?? []) {
        const clean = (d.definition ?? "")
          .replace(/<[^>]*>/g, "")
          .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m)
          .replace(/\s+/g, " ")
          .trim();
        if (clean.length >= 8) {
          const pos = entry.partOfSpeech?.toLowerCase();
          const short = shorten(clean, 170);
          return pos ? `(${pos}) ${short}` : short;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function dictionaryApiDefinition(text: string): Promise<string | null> {
  const term = text.trim();
  // The dictionary endpoint only knows single words.
  if (!term || term.length < 2 || /\s/.test(term)) return null;
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(term.toLowerCase())}`,
      { signal: AbortSignal.timeout(4000) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{
      meanings?: Array<{ partOfSpeech?: string; definitions?: Array<{ definition?: string }> }>;
    }>;
    const meaning = data?.[0]?.meanings?.[0];
    const def = meaning?.definitions?.[0]?.definition;
    if (!def) return null;
    const short = shorten(def, 170);
    return meaning?.partOfSpeech ? `(${meaning.partOfSpeech}) ${short}` : short;
  } catch {
    return null;
  }
}

/** Wikipedia's lead summary — catches concepts, effects, theories and proper nouns. */
async function wikipediaSummary(text: string): Promise<string | null> {
  const term = text.trim();
  if (!term || term.length < 2 || term.split(/\s+/).length > 6) return null;
  try {
    const title = encodeURIComponent(term.replace(/\s+/g, "_"));
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`, {
      headers: { "user-agent": "Lemma/1.0 (reading-notes app)", accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { type?: string; extract?: string };
    if (data.type !== "standard" || !data.extract) return null; // skip disambiguation pages
    return shorten(data.extract, 230) || null;
  } catch {
    return null;
  }
}

export async function explain(input: ExplainInput): Promise<ExplainResult> {
  const [explanation, dictionary_definition, encyclopedic_summary] = await Promise.all([
    claudeExplanation(input),
    dictionaryDefinition(input.text),
    wikipediaSummary(input.text),
  ]);
  return { explanation, dictionary_definition, encyclopedic_summary };
}
