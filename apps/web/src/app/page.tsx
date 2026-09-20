import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Drop the launch video's URL here (mp4/webm). Until then a placeholder holds the space. */
const VIDEO_URL: string | null = null;

function VideoSlot() {
  if (VIDEO_URL) {
    return <video className="aspect-video w-full rounded-2xl bg-ink" src={VIDEO_URL} controls playsInline />;
  }
  return (
    <div className="relative flex aspect-video w-full items-center justify-center rounded-2xl border border-line bg-paper-warm">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-paper-raised shadow-md">
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
          <path d="M6 3.5v13l11-6.5z" fill="currentColor" />
        </svg>
      </span>
      <span className="absolute bottom-3 left-4 text-sm text-ink-faint">See it in action (40s), coming soon</span>
    </div>
  );
}

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
        Write down why it mattered. Lemma brings it back until it sticks.
      </h1>
      <p className="mt-6 max-w-lg text-lg text-ink-soft">
        Right-click a word, a formula, a link — anything you don't want to lose while reading —
        and write one sentence on <em>why it mattered to you</em>. That sentence is what you keep.
        It returns on a spaced-review schedule, so you remember it instead of losing it in fifty
        browser tabs.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href="/signup"
          className="press rounded-xl bg-accent px-5 py-3 text-sm font-medium text-paper-raised hover:bg-accent-soft"
        >
          Create an account
        </Link>
        <Link
          href="/login"
          className="press rounded-xl border border-line bg-paper-raised px-5 py-3 text-sm font-medium text-ink"
        >
          Sign in
        </Link>
        <Link href="/welcome" className="px-2 text-sm text-ink-soft underline underline-offset-4">
          See how it works
        </Link>
      </div>

      <div className="mt-12 max-w-xl">
        <VideoSlot />
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
          title="Share a space"
          body="Create a space and invite someone by email. You both add to it, and everything either of you saves shows up for both."
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
