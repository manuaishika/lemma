# Lemma — local setup

End-to-end, from a clean checkout to capturing a word and reviewing it.

## 1. Toolchain

- Node 20+ (`node -v`)
- pnpm 9+ — `npm install -g pnpm`
- (optional) Supabase CLI — `npm install -g supabase`, for `pnpm db:push`

```bash
pnpm install
pnpm --filter @lemma/shared build
```

## 2. Accounts / keys

### Fastest path — all local, no accounts (verified)

If you have Docker running, skip the cloud project entirely:

```bash
npx supabase start          # first run pulls images (~5 min); prints local keys
```

Copy the printed `API URL`, `anon key`, and `service_role key` into
`apps/web/.env.local` (there is already one checked in pointing at the default
local ports — it works as-is unless you changed them). Then jump to step 4.

`npx supabase start` gives you a real Postgres + Auth with the schema applied.
The whole loop works; only `/api/explain` degrades — with no `ANTHROPIC_API_KEY`
it returns the dictionary fallback instead of a Claude explanation.

Manage it with `npx supabase stop` / `npx supabase db reset` (re-applies
migrations + `seed.sql`).

### Cloud path

You need two things for the core loop:

| Key | Where | Env var(s) |
|---|---|---|
| Supabase project | supabase.com → New project (free tier is fine) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Anthropic API key | console.anthropic.com → API keys | `ANTHROPIC_API_KEY` |

In the Supabase dashboard: **Project Settings → API** has the URL and the
`anon` / `service_role` keys.

```bash
cp .env.example .env
# edit .env with the values above
```

`OPENAI_API_KEY` and `RESEND_API_KEY` are only needed for the follow-up
features (clustering, digest email) — leave them blank for now.

## 3. Database schema

The schema is six SQL files in `supabase/migrations/`, applied in order:
`0001_schema.sql` (7 tables), `0002_triggers.sql` (profile-on-signup,
SRS-card-on-capture-insert, `apply_review` RPC), `0003_rls.sql` (row-level
security), `0004_captures.sql` (generalizes `words` into `captures` —
term/note/screenshot/link — and adds `spaces`/`space_members`),
`0005_captures_rls.sql` (owner-or-space-member visibility), `0006_storage.sql`
(private `captures` storage bucket for screenshots).

**Option A — Supabase CLI:**

```bash
pnpm supabase login
pnpm supabase link --project-ref <your-project-ref>
pnpm db:push
```

**Option B — SQL editor:** open each file in
`supabase/migrations/` and run them in the dashboard's SQL editor, in numeric
order.

Verify in **Table editor**: `profiles`, `captures`, `srs_cards`, `review_logs`,
`word_embeddings`, `clusters`, `word_clusters`, `spaces`, `space_members`.
Under **Database → Functions** you should see `apply_review`,
`handle_new_user`, `handle_new_capture`, `handle_new_space`,
`lookup_user_by_email`, `is_space_member`. Under **Storage** you should see a
private `captures` bucket.

The `vector` extension is created by `0001_schema.sql`; if the dashboard warns,
enable **Database → Extensions → vector** manually.

## 4. Web app

```bash
pnpm web        # http://localhost:3000
```

Open the site, click **Get started**, sign up with an email + password
(email confirmation is off for dev). You land on `/app` with an empty vault.

## 5. Extension

Build it pointed at your local web app. The build reads `NEXT_PUBLIC_SUPABASE_*`
from the environment too (for token refresh), so export them or source `.env`:

```bash
set -a && . ./.env && set +a
LEMMA_API_BASE=http://localhost:3000 pnpm --filter @lemma/extension build
```

Then in Chrome:

1. `chrome://extensions` → enable **Developer mode**
2. **Load unpacked** → select `apps/extension/dist`
3. Note the extension ID it shows. The build already whitelists
   `http://localhost:3000/*` in `externally_connectable`, so the connect page
   can reach it.
4. Click the Lemma toolbar icon → **Connect account** → a tab opens at
   `/extension/connect`; if you're signed in it says "Connected as …".

## 6. Try the loop

1. On any article, select a single word → right-click → **Save "…" to Lemma**
   (or press Ctrl+Shift+S). Try the other two capture modes too: right-click
   anywhere with nothing selected → **Save screenshot to Lemma**, or
   right-click a link → **Save this link to Lemma**.
2. For a word/phrase, the popup shows a Claude explanation of how it's used in
   that sentence (muted) and a dictionary fallback (collapsed); screenshots and
   links skip straight to the note field. Type your own understanding. **Save**.
3. Back in the web app, reload `/app` — the capture is there, your note
   prominent. Try `/app/spaces/new` to create a shared space, invite a second
   account by email from its settings page, and save a capture into it via the
   space switcher in the header.
4. Go to `/app/review`. The new card is due immediately (every capture type is
   reviewable). Reveal your note, grade it. In the Supabase dashboard,
   `srs_cards` for that capture now shows a
   bumped `interval_days` / `due_at` / `ease_factor`, and there's a new
   `review_logs` row.

## Troubleshooting

- **Popup says "Connect account" after connecting** — the extension ID in
  `externally_connectable` must match. Rebuild after changing `LEMMA_API_BASE`,
  and reload the extension.
- **`/api/explain` returns no explanation** — check `ANTHROPIC_API_KEY` in
  `.env` and restart `pnpm web`. The save still works; the field just falls
  back to the dictionary text.
- **401s from the extension** — the access token expired and refresh failed;
  click Connect account again. Refresh needs `NEXT_PUBLIC_SUPABASE_URL` /
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` present at extension build time.
- **RLS errors on insert** — confirm `0003_rls.sql` ran and that you're signed
  in; every table is scoped to `auth.uid()`.
