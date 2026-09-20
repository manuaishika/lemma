import type { Capture } from "@lemma/shared";

type Layers = Pick<Capture, "dictionary_definition" | "encyclopedic_summary" | "explanation">;

/**
 * The look-it-up layer, in fixed order everywhere: what it objectively means
 * (dictionary), what it is (Wikipedia), then how it's used in this passage.
 * The user's own note always comes after and is the only accent-bordered thing.
 */
export function ReferenceLayers({ c, compact = false }: { c: Layers; compact?: boolean }) {
  if (!c.dictionary_definition && !c.encyclopedic_summary && !c.explanation) return null;
  const gap = compact ? "mt-3" : "mt-6";

  return (
    <div>
      {c.dictionary_definition && (
        <section className={gap}>
          <h2 className="text-xs uppercase tracking-wide text-ink-faint">Definition</h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink">{c.dictionary_definition}</p>
        </section>
      )}
      {c.encyclopedic_summary && (
        <section className={gap}>
          <h2 className="text-xs uppercase tracking-wide text-ink-faint">From Wikipedia</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{c.encyclopedic_summary}</p>
        </section>
      )}
      {c.explanation && (
        <section className={gap}>
          <h2 className="text-xs uppercase tracking-wide text-ink-faint">How it&rsquo;s used here</h2>
          <p className="explanation-scaffold mt-1.5">{c.explanation}</p>
        </section>
      )}
    </div>
  );
}
