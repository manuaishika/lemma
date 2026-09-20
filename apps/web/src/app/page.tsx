import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CaptureDemoPicker } from "@/components/CaptureDemoPicker";
import { ReviewDemo } from "@/components/ReviewDemo";
import { SpacesDemo } from "@/components/SpacesDemo";
import { ReferenceLayers } from "@/components/ReferenceLayers";

export const dynamic = "force-dynamic";

/** Drop the launch video's URL here (mp4/webm). Until then a placeholder holds the space. */
const VIDEO_URL: string | null = null;

const SAMPLE = {
  dictionary_definition:
    "(noun) the simultaneous buying and selling of assets in different markets to profit from a difference in price.",
  encyclopedic_summary:
    "Arbitrage is the practice of taking advantage of a price difference between two or more markets, striking a combination of matching deals to capture the imbalance as profit.",
  explanation:
    "Here it means the traders bought on the cheaper exchange and sold on the dearer one at the same moment, so the gap turned into risk-free profit.",
};

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
      <span className="absolute bottom-3 left-4 text-sm text-ink-faint">Watch it in 40 seconds, coming soon</span>
    </div>
  );
}

function Feature({
  eyebrow,
  title,
  children,
  demo,
  flip = false,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  demo: React.ReactNode;
  flip?: boolean;
}) {
  return (
    <section className="grid gap-10 border-t border-line py-16 md:grid-cols-2 md:items-center md:gap-14">
      <div className={flip ? "md:order-2" : ""}>
        <p className="text-xs uppercase tracking-wide text-ink-faint">{eyebrow}</p>
        <h2 className="mt-2 font-serif text-3xl leading-tight text-ink">{title}</h2>
        <div className="mt-4 max-w-md space-y-3 text-[15px] leading-relaxed text-ink-soft">{children}</div>
      </div>
      <div className={flip ? "md:order-1" : ""}>{demo}</div>
    </section>
  );
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/app");

  return (
    <main className="mx-auto max-w-5xl px-6 pb-20">
      <header className="flex items-center justify-between py-6">
        <Link href="/" className="font-serif text-2xl italic text-ink" aria-label="Lemma home">
          Lemma
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/login" className="text-ink-soft hover:text-ink">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="press rounded-xl bg-accent px-4 py-2 font-medium text-paper-raised hover:bg-accent-soft"
          >
            Create an account
          </Link>
        </nav>
      </header>

      {/* hero: the promise on the left, the real mechanism playing on the right */}
      <section className="grid gap-12 py-10 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:py-20">
        <div className="ob-screen">
          <h1 className="font-serif text-4xl leading-[1.1] text-ink sm:text-5xl">
            Write down why it mattered. Lemma brings it back until it sticks.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-ink-soft">
            Right-click a word, a formula, a link, anything you don&rsquo;t want to lose while reading. Lemma keeps the
            meaning, asks you for one sentence on <em>why it mattered</em>, and returns it on a schedule so it
            actually sticks.
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
          </div>
          <p className="mt-4 text-sm text-ink-faint">Works with a right-click. Nothing to copy, paste or file.</p>
        </div>
        <div className="ob-screen">
          <CaptureDemoPicker />
        </div>
      </section>

      <Feature
        eyebrow="The meaning first"
        title="Every save arrives with what it means, then what it meant to you."
        demo={
          <div className="rounded-2xl border border-line bg-paper-raised p-5 shadow-md">
            <p className="font-serif text-3xl text-ink">arbitrage</p>
            <ReferenceLayers c={SAMPLE} />
            <div className="mt-5">
              <p className="text-xs uppercase tracking-wide text-ink-faint">
                Your note <span className="normal-case tracking-normal">(optional)</span>
              </p>
              <p className="note-artifact mt-2 font-serif text-lg leading-relaxed">
                Making money from a price gap before anyone else notices it.
              </p>
            </div>
          </div>
        }
      >
        <p>
          The dictionary definition comes first, then the Wikipedia summary, then how your sentence uses the word. Your
          own note comes last, and it&rsquo;s the only thing on the card that&rsquo;s yours.
        </p>
        <p>The note is optional, but it&rsquo;s the part Lemma tests you on.</p>
      </Feature>

      <Feature
        flip
        eyebrow="It comes back"
        title="Everything you save comes back, the right way."
        demo={<ReviewDemo />}
      >
        <p>
          Words and formulas come back for a quick recall check. Again, Hard, Good or Easy decides when you see them
          next.
        </p>
        <p>
          Links, pages and passages come back as a gentle reminder instead: Done or Snooze, no grading. Lemma decides
          which is which, and you can change any one later.
        </p>
        <p>Bookmarks get forgotten because nothing ever brings them back. This does.</p>
      </Feature>

      <Feature
        eyebrow="Spaces"
        title="Share anything with anyone."
        demo={<SpacesDemo />}
      >
        <p>
          Make a space, invite someone by email, and pick it whenever you save. Words, screenshots, links and whole pages
          all go in.
        </p>
        <p>They don&rsquo;t need an account yet. The invite waits for them, and everything shows who shared it.</p>
      </Feature>

      <section className="grid gap-10 border-t border-line py-16 md:grid-cols-2 md:items-center md:gap-14">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-faint">Why not just bookmark it?</p>
          <h2 className="mt-2 font-serif text-3xl leading-tight text-ink">Bookmarks are where things go to be forgotten.</h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
            You save it, you never open it again. Lemma asks for one sentence about why it mattered while it&rsquo;s
            still fresh, then resurfaces that sentence on a schedule until you know it.
          </p>
        </div>
        <VideoSlot />
      </section>

      <section className="rounded-3xl bg-paper-warm px-6 py-14 text-center">
        <h2 className="mx-auto max-w-xl font-serif text-3xl leading-tight text-ink">
          Start a vault for the things you don&rsquo;t want to lose.
        </h2>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="press rounded-xl bg-accent px-6 py-3 text-sm font-medium text-paper-raised hover:bg-accent-soft"
          >
            Create an account
          </Link>
          <Link
            href="/login"
            className="press rounded-xl border border-line bg-paper-raised px-6 py-3 text-sm font-medium text-ink"
          >
            Sign in
          </Link>
        </div>
      </section>

      <footer className="mt-12 flex items-center justify-between text-sm text-ink-faint">
        <span className="font-serif italic">Lemma</span>
        <Link href="/privacy" className="underline underline-offset-4 hover:text-ink">
          Privacy
        </Link>
      </footer>
    </main>
  );
}
