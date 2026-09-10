import Link from "next/link";
import type { Capture } from "@lemma/shared";
import { CaptureImage } from "./CaptureImage";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * The note is the artifact: full contrast, accent border. The explanation is
 * scaffolding: small, muted, below. Rendering branches on capture_type but
 * the note-vs-explanation treatment is the same for every kind.
 */
export function CaptureCard({ capture, href }: { capture: Capture; href?: string }) {
  const title = (
    <span className="font-serif text-2xl text-ink">
      {capture.capture_type === "screenshot"
        ? capture.text || "Screenshot"
        : capture.capture_type === "link"
          ? capture.text || hostname(capture.link_url ?? "")
          : capture.text}
      {capture.capture_type !== "term" && (
        <span className="ml-2 align-middle text-xs uppercase tracking-wide text-ink-faint">
          {capture.capture_type}
        </span>
      )}
    </span>
  );

  return (
    <article className="border-b border-line py-6">
      <div className="flex items-baseline justify-between gap-4">
        {href ? (
          <Link href={href} className="hover:underline underline-offset-4">
            {title}
          </Link>
        ) : (
          title
        )}
        <time className="shrink-0 text-xs text-ink-faint">{formatDate(capture.created_at)}</time>
      </div>

      {capture.capture_type === "link" && capture.link_url && (
        <a
          href={capture.link_url}
          target="_blank"
          rel="noreferrer"
          className="mt-1 block truncate text-xs text-ink-faint underline underline-offset-2"
        >
          {capture.link_url}
        </a>
      )}

      {capture.capture_type === "screenshot" && <CaptureImage id={capture.id} alt={capture.text || "Screenshot"} />}

      {capture.user_note ? (
        <p className="note-artifact mt-4 whitespace-pre-wrap text-[15px] leading-relaxed">
          {capture.user_note}
        </p>
      ) : (
        <p className="mt-4 text-sm italic text-ink-faint">No understanding written yet.</p>
      )}

      {capture.explanation && <p className="explanation-scaffold mt-4">{capture.explanation}</p>}

      {capture.sentence && (
        <p className="mt-3 text-sm text-ink-faint">
          &ldquo;…{capture.sentence}…&rdquo;
          {capture.source_url && (
            <>
              {" "}
              <a
                href={capture.source_url}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                {capture.page_title || "source"}
              </a>
            </>
          )}
        </p>
      )}

      {capture.dictionary_definition && (
        <details className="mt-3 text-sm text-ink-faint">
          <summary className="cursor-pointer select-none">Dictionary</summary>
          <p className="mt-1">{capture.dictionary_definition}</p>
        </details>
      )}
    </article>
  );
}
