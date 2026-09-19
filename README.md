# Lemma

A personal semantic memory system for anything you meet while reading —
a word, an idea, a screenshot of a formula, a link worth returning to.

Capture it in context → for text, get a short explanation of how it's used
*here* → write what it means to you. **That note is the artifact.** Spaced
review (SM-2) brings it back before you forget it — every capture type is
reviewable, not just vocabulary. Optionally drop a capture into a shared
**space**: an async shared folder (not live co-editing) where invited people
see what gets added on refresh.

> Formerly the "Word Vault" browser extension. Same idea, now a full stack:
> a Chrome extension for capture, a web app for the vault + review, and a
> Supabase backend so it syncs across devices.

## Monorepo layout

```
apps/extension     Chrome MV3 extension (TypeScript, esbuild). Capture + save.
apps/web           Next.js 15 app router. Dashboard, review, and the API.
packages/shared    @lemma/shared — SM-2 algorithm, domain + API types, text helpers.
supabase/          Postgres schema, triggers, RLS (7 tables).
```

## Quick start

Prerequisites: Node 20+, pnpm 9+ (`npm i -g pnpm`), a Supabase project, an
Anthropic API key. Full walkthrough: [`docs/SETUP.md`](docs/SETUP.md).

```bash
pnpm install
cp .env.example .env            # fill in Supabase + Anthropic keys
pnpm --filter @lemma/shared build

# apply the database schema (Supabase CLI, or paste supabase/migrations/*.sql
# into the SQL editor in order)
pnpm supabase link --project-ref <ref>
pnpm db:push

pnpm web                        # http://localhost:3000
LEMMA_API_BASE=http://localhost:3000 pnpm --filter @lemma/extension build
# then load apps/extension/dist as an unpacked extension at chrome://extensions
```

## What works today (core loop)

- Capture three kinds of things, from the extension's right-click menu:
  a **word/phrase selection** (+ its sentence, page title, URL), a
  **screenshot** (visible tab), or a **link**
  - Text captures get a context-aware explanation (Claude) with a dictionary
    fallback, shown recessively — screenshots/links skip that and go straight
    to your note
- Save to Supabase; the vault lists everything, newest first, per capture type
- Capture detail page with an inline note editor
- SM-2 review across every capture type: Again / Hard / Good / Easy, ease +
  interval compounding, logged
- **Spaces**: create an async shared folder, invite an existing Lemma user by
  email, both add captures, everyone sees them on refresh. A collaborator can
  add to a space but not edit/delete someone else's capture in it (yet).
- **Reminder email**: every capture gets a `remind_at` 3 days out; `GET
  /api/remind` (Vercel Cron, daily) emails "still want to look into this?" via
  Resend and marks it sent. See [`docs/SETUP.md`](docs/SETUP.md#7-reminder-emails).

## Not built yet (schema is ready for it)

Re-encounter detection (underline saved words as you browse), semantic
clustering (embeddings + k-means + Claude-named clusters), offline capture
queue, Chrome Web Store packaging, editable permissions for space
collaborators, invite-by-email-for-people-without-an-account.

## Scripts

| Command | What |
|---|---|
| `pnpm dev` | turbo `dev` across packages |
| `pnpm web` | web app only, port 3000 |
| `pnpm build` | build everything |
| `pnpm test` | run tests (SM-2 suite) |
| `pnpm typecheck` | type-check everything |
| `pnpm db:push` / `pnpm db:reset` | apply / reset the Supabase schema |
