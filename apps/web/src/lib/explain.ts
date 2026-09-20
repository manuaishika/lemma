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
    return meaning?.partOfSpeech ? `(${meaning.partOfSpeech}) ${def}` : def;
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
    const sentences = data.extract.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [data.extract];
    return sentences.slice(0, 2).join("").trim().slice(0, 420) || null;
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
