import Link from "next/link";

export const metadata = { title: "Privacy — Lemma" };

/** Public contact for privacy questions and account deletion requests. Set before submitting to the store. */
const CONTACT_EMAIL: string = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xs uppercase tracking-wide text-ink-faint">{title}</h2>
      <div className="mt-3 max-w-lg space-y-3 text-sm leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-reading px-6 py-16">
      <Link href="/" className="font-serif text-sm italic text-ink-faint">
        Lemma
      </Link>
      <h1 className="mt-4 font-serif text-3xl text-ink">Privacy</h1>
      <p className="mt-2 text-xs text-ink-faint">Last updated 21 September 2026</p>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">
        Lemma has one job: it keeps the words, passages, screenshots, links and pages you choose to save while
        reading, and brings them back to you later. This page says what that involves, in plain language.
      </p>

      <Section title="What the extension can see">
        <p>
          The Lemma browser extension runs a small script on the pages you visit so it can notice what you have
          selected. That stays on your device. Nothing leaves your browser until you choose <em>Save</em>, from the
          right-click menu, the keyboard shortcut or the toolbar button.
        </p>
      </Section>

      <Section title="What we collect">
        <p>Your name and email address, to create your account and sign you in.</p>
        <p>
          What you save: the word, phrase or passage you highlighted, the sentence around it, the page title and
          address, the part of the screen you chose to capture, a link or page you saved, and any note you write.
        </p>
        <p>
          How you organise it: the spaces you create or join, and the email addresses of people you invite to a space.
        </p>
        <p>Your review history, meaning when you reviewed something and how it went, so Lemma can schedule what comes back next.</p>
      </Section>

      <Section title="Who processes it">
        <p>
          <strong className="font-medium text-ink">Supabase</strong> stores your account, your captures and your
          screenshots. Screenshots sit in a private bucket that only your account can read. Every query is scoped to
          your account with row-level security.
        </p>
        <p>
          <strong className="font-medium text-ink">Vercel</strong> hosts the website and the API.
        </p>
        <p>
          <strong className="font-medium text-ink">Anthropic</strong> receives the word or phrase you save, the sentence
          around it and the page title and address, to write a short note on how it is used there. Nothing else about
          you is included.
        </p>
        <p>
          <strong className="font-medium text-ink">Dictionary and encyclopedia lookups</strong> (Wiktionary, Wikipedia
          and dictionaryapi.dev) receive only the word or phrase, to fetch its definition.
        </p>
        <p>
          <strong className="font-medium text-ink">Resend</strong> sends the emails described below.
        </p>
        <p>If you sign in with Google, Google handles that sign-in. Lemma never sees your Google password.</p>
      </Section>

      <Section title="Emails we send">
        <p>
          A few days after you save a link, page or passage, we may email you to ask if you still want to look at it.
          When you invite someone who has no account yet, we email them the invitation. Those are the only emails.
        </p>
      </Section>

      <Section title="What we don't do">
        <p>
          We don&rsquo;t sell your data, show ads, or run analytics or third-party trackers. We use your data only to
          provide Lemma to you. Nobody at Lemma reads your captures unless you ask us to help with a problem, it is
          needed to keep the service secure or to obey the law.
        </p>
        <p>
          The use of information received through the Lemma extension follows the Chrome Web Store User Data Policy,
          including its Limited Use requirements.
        </p>
      </Section>

      <Section title="Sharing with other people">
        <p>
          A capture only leaves your account if you put it in a space and invite someone. A space is visible only to
          its owner and the people invited into it, and everyone in it can see who added what.
        </p>
      </Section>

      <Section title="Keeping and deleting your data">
        <p>
          Deleting a capture removes it, its review history and its screenshot straight away. To delete your whole
          account and everything in it, email us and we will do it.
        </p>
        <p>Data travels over HTTPS.</p>
      </Section>

      <Section title="Contact">
        {CONTACT_EMAIL ? (
          <p>
            Questions about this page or your data, or to delete your account:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-ink underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>
          </p>
        ) : (
          <p>Questions about this page or your data: use the contact details on Lemma&rsquo;s store listing.</p>
        )}
      </Section>
    </main>
  );
}
