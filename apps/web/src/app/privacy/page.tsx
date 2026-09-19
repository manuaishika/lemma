export const metadata = { title: "Privacy — Lemma" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xs uppercase tracking-wide text-ink-faint">{title}</h2>
      <div className="mt-3 max-w-lg space-y-3 text-sm text-ink-soft">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-reading px-6 py-16">
      <p className="font-serif text-sm italic text-ink-faint">Lemma</p>
      <h1 className="mt-4 font-serif text-3xl text-ink">Privacy</h1>
      <p className="mt-4 max-w-lg text-sm text-ink-soft">
        Lemma is a personal tool for the words, screenshots, and links you save while reading.
        Here's what that means for your data, in plain language.
      </p>

      <Section title="What we collect">
        <p>Your email address, to create and sign you into an account.</p>
        <p>
          What you save: the word or text you highlighted, the surrounding sentence, the page
          title and URL, a screenshot if you took one, a link if you saved one, and the note you
          write about it.
        </p>
        <p>
          Your review history — when you review a capture and how well you remembered it — so
          spaced repetition can schedule what to show you next.
        </p>
      </Section>

      <Section title="What we don't collect">
        <p>
          No ad tracking, no analytics pixels, no third-party trackers, no selling or sharing your
          data for advertising. There's no analytics script in this app at all.
        </p>
      </Section>

      <Section title="Where it's processed">
        <p>
          Your account and everything you save live in a Postgres database (Supabase), scoped to
          your account with row-level security — no one else's queries can read your captures.
        </p>
        <p>
          When you save a word or phrase, the text and its surrounding sentence are sent to
          Anthropic's Claude API to generate a short, context-aware explanation. Nothing else
          about you is included in that request.
        </p>
        <p>
          If you sign in with Google, Google handles that authentication; Lemma never sees your
          Google password.
        </p>
        <p>
          Three days after you save something, we email you a reminder via Resend asking if you
          still want to look into it. That email goes only to the address on your account.
        </p>
      </Section>

      <Section title="Sharing with other people">
        <p>
          Captures only leave your account if you put them in a Space and invite someone by email.
          A Space is visible only to its owner and the people invited into it.
        </p>
      </Section>

      <Section title="Deleting your data">
        <p>
          Deleting a capture removes it, its review history, and its screenshot (if any)
          immediately. Deleting your account removes your profile and everything tied to it.
        </p>
      </Section>

      <Section title="Contact">
        <p>Questions about this page or your data: reach out to the person who shared Lemma with you.</p>
      </Section>
    </main>
  );
}
