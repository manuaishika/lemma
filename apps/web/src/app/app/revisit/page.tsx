import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dueRevisits } from "@/lib/resurfaceCounts";
import { RevisitActions } from "@/components/RevisitActions";

export const dynamic = "force-dynamic";

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default async function RevisitPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const items = await dueRevisits(supabase, user.id);

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">Still want to look at these?</h1>
      <p className="mt-1 text-[15px] text-ink-soft">
        Links, pages and passages you saved a few days ago. No grading, just a nudge.
      </p>

      {items.length === 0 ? (
        <p className="mt-10 text-sm text-ink-faint">
          Nothing to revisit right now. Things you save come back here a few days later.
        </p>
      ) : (
        <div className="mt-6">
          {items.map((c) => {
            const title =
              c.capture_type === "link"
                ? c.text || hostname(c.link_url ?? "")
                : c.capture_type === "screenshot"
                  ? c.text || "Screenshot"
                  : c.text;
            const href = c.capture_type === "link" && c.link_url ? c.link_url : `/app/capture/${c.id}`;
            const external = c.capture_type === "link" && !!c.link_url;
            return (
              <article key={c.id} className="border-b border-line py-6">
                <span className="text-xs uppercase tracking-wide text-ink-faint">
                  {c.capture_type === "note" ? "passage" : c.capture_type}
                </span>
                <h2 className="mt-1 font-serif text-2xl text-ink">
                  {external ? (
                    <a href={href} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                      {title}
                    </a>
                  ) : (
                    <Link href={href} className="underline-offset-4 hover:underline">
                      {title}
                    </Link>
                  )}
                </h2>
                {c.link_url && <p className="mt-1 truncate text-xs text-ink-faint">{hostname(c.link_url)}</p>}
                {c.user_note && (
                  <p className="note-artifact mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{c.user_note}</p>
                )}
                <RevisitActions captureId={c.id} />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
