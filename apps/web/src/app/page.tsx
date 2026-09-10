import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="flex gap-4">
      <span className="font-serif text-2xl italic text-ink-faint">{n}</span>
      <div>
        <h3 className="font-medium text-ink">{title}</h3>
        <p className="mt-1 text-sm text-ink-soft">{body}</p>
      </div>
    </div>
  );
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/app");

  return (
    <main className="mx-auto max-w-reading px-6 py-16">
      <p className="font-serif text-sm italic text-ink-faint">Lemma</p>

      <h1 className="mt-4 font-serif text-4xl leading-tight text-ink sm:text-5xl">
        A save button for anything you don't want to lose while reading.
      </h1>
      <p className="mt-6 max-w-lg text-lg text-ink-soft">
        A word you don't know, a screenshot of a formula, a link you'll want later — one
        right-click saves it, with a place to write <em>why it mattered to you</em>. That note is
        what you keep. Everything comes back on a spaced-review schedule so you actually remember
        it instead of losing it in fifty browser tabs.
      </p>

      <div className="mt-8 flex items-center gap-4">
        <Link
          href="/login"
          className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-paper-raised transition hover:bg-accent-soft"
        >
          Create an account
        </Link>
        <Link href="/login" className="text-sm text-ink-soft underline underline-offset-4">
          Sign in
        </Link>
      </div>

      <section className="mt-20 space-y-8 border-t border-line pt-10">
        <h2 className="text-xs uppercase tracking-wide text-ink-faint">How it works</h2>
        <Step
          n="1"
          title="Right-click to save"
          body="Highlight a word or phrase, right-click any page, or right-click a link — Lemma captures it along with the sentence and page it came from."
        />
        <Step
          n="2"
          title="Write your own understanding"
          body="For words, Lemma shows a quick explanation of how it's used in that context (plus a plain dictionary definition), but the field that matters is the one you fill in yourself."
        />
        <Step
          n="3"
          title="It comes back before you forget it"
          body="Everything you save enters a spaced-repetition review queue — grade Again / Hard / Good / Easy and it reschedules itself, like flashcards, for every capture type."
        />
        <Step
          n="4"
          title="Share a folder, optionally"
          body="Create a space and invite someone by email — a shared folder you both add to. Not live editing, just a place things show up for both of you."
        />
      </section>

      <section className="mt-16 border-t border-line pt-10">
        <h2 className="text-xs uppercase tracking-wide text-ink-faint">Why not just bookmark it?</h2>
        <p className="mt-3 max-w-lg text-sm text-ink-soft">
          Bookmarks and screenshot folders are where things go to be forgotten — you never
          re-open them. Lemma forces you to write one sentence about why something mattered the
          moment you save it, and then resurfaces that sentence on a schedule until it sticks.
        </p>
      </section>
    </main>
  );
}
