# Lemma — what we promise vs. what's true

Audited 2026-09-20 against the code, the live site, and the live Supabase project.
**Update this file whenever something ships or a claim changes.** If a promise isn't
✅ or 🟢 here, it shouldn't be on the landing page.

| | Meaning |
|---|---|
| ✅ | Verified working on the live site / live backend |
| 🟢 | Built and code-reviewed, **not yet run end to end** |
| 🟡 | Partly there — see the gap |
| 🔴 | Not built, or the claim is currently false |
| ❓ | Can't tell from here — needs a check by a person with dashboard access |

## 1. Promises on the live landing page

| Promise | Status | Evidence / gap |
|---|---|---|
| Right-click a word or phrase to save it, with its sentence and source page | 🟢 | `extension/src/content.ts`, `background.ts`. Extension isn't on the Web Store, so nobody but us can install it yet. |
| Right-click to save a screenshot (formula, diagram, chart) | 🟢 | Drag-to-select crop shipped `ff119c1`. **Never loaded in Chrome.** Can't capture past the scroll edge; Chrome's PDF viewer blocks the overlay. |
| Right-click to save a link | 🟢 | `background.ts` link menu. |
| A note field for *why it mattered to you* | 🟢 | Popup + capture detail page. |
| "Lemma forces you to write one sentence… the moment you save it" | 🟢 | Now enforced: `POST /api/captures` and `PATCH` reject an empty note, the popup blocks Save until you've written one, and the web note editor won't save blank. Not run in Chrome yet. Captures saved before 2026-09-20 may still have no note. |
| Explanation of how a word is used in *this* passage, plus a plain dictionary definition | ❓ | Popup shows both and saves both (`popup.ts`, `explain.ts`). The Claude explanation only runs if `ANTHROPIC_API_KEY` is set in Vercel — can't see that from here; without it users get the dictionary only. |
| Spaced review — Again / Hard / Good / Easy — for every capture type | 🟢 | Review UI + `/api/review`; no per-type filter. SM-2 now uses the brief's constants (§3). |
| Spaces: "invite someone by email" | 🟢 | Works for people with or without an account: no account → a pending invite is stored and claimed automatically when they sign up (tested on a real Postgres, 2026-09-20). **Needs migration `0008` on the cloud DB.** Invite email only sends if Resend is configured. |
| Sign up / sign in with email + password | ✅ backend, ❓ form | Live API: signup → session, sign-in → token, profile trigger, `/api/captures` 200 (2026-09-19). The browser form + redirect to `/app` hasn't been confirmed by a person. |
| Google sign-in | 🔴 | Provider not enabled in Supabase. Button hides itself until it is; no redeploy needed. |

## 2. Promises in the brief

| Item | Status | Notes |
|---|---|---|
| P0 — login works | 🟡 | Env vars ✅, email-confirm off ✅, API ✅, `/auth/callback` ✅ added. Still ❓: browser sign-in, Supabase Site URL / redirect list. |
| P0 — landing copy (headline, split CTAs, un-hedge step 4) | 🟢 | Shipped `c6e5b58`. |
| P1 — progressive onboarding, 7 screens (web) | 🔴 | No onboarding route exists. |
| P1 — condensed onboarding in extension popup | 🔴 | |
| P1 — motion spec (`--spring`, `--ease`, shadows, stagger, flip, shimmer, reduced-motion) | 🔴 | `globals.css` is 28 lines; none of it exists. |
| Design system palette + dark mode | 🟡 | Light palette only, token names/values differ from the brief (`paper-raised`, `accent-soft`, `ink #1a1a17`…). No dark mode. |
| Type: Newsreader + Inter (web) | ✅ | `layout.tsx`. |
| Type: popup uses system-ui only | 🟡 | Popup names Newsreader with a Georgia fallback; no web font is loaded so it renders Georgia. |
| AI explanation recessive, user's note gets the accent border | ❓ | Not audited yet. |
| No gamification | ✅ | No streak / confetti / badge code found. |
| SM-2 with the brief's constants | 🟢 | Matched 2026-09-20, 11 tests pass. Consequence: Hard/Good/Easy give the *same next interval* on a given review (they differ only in the ease afterwards), so the review buttons will show equal day-counts. The brief's `lapses` counter isn't stored — there is no column for it. |
| Extension ↔ web session handoff | 🟢 | `externally_connectable` is patched from `LEMMA_API_BASE` at build. Must package with the Vercel URL (`pnpm --filter @lemma/extension package` refuses localhost). |
| P2 — Chrome Web Store | 🔴 | Zip script ✅, `/privacy` page ✅. Needs a developer account ($5), store screenshots and listing copy. |
| P2 — Play Store | 🔴 | Not started. |

## 3. Decisions — resolved 2026-09-20

1. **Note required — yes.** Enforced in API, popup and web editor.
2. **SM-2 — match the brief.** Ease deltas Again −0.20 / Hard −0.15 / Good 0 / Easy +0.15; next
   interval uses the ease *before* the delta; only Again is a lapse.
3. **Invites for people without an account — pending invites.** Known limit: Supabase currently
   auto-confirms emails, so anyone can register as any address and would claim a pending invite
   meant for it. Low risk for launch; fix by turning on "Confirm email" and only claiming invites
   for confirmed addresses.

## 4. Built but not live

| Feature | To turn it on |
|---|---|
| Pending space invites | Run `supabase/migrations/0008_space_invites.sql` on the cloud DB (after `0007`). Adds a table and replaces the signup trigger — run it in the SQL editor and confirm a test signup still works. |
| Reminder emails (3 days after a capture) | Run `supabase/migrations/0007_reminders.sql` on the cloud DB; set `RESEND_API_KEY`, `LEMMA_REMINDER_FROM`, `CRON_SECRET` in Vercel; redeploy. |
| Google sign-in | Google Cloud OAuth client → Supabase Auth → Providers → Google; add `https://lemma-web-dun.vercel.app/auth/callback` to redirect URLs. |
| Context explanations | Confirm `ANTHROPIC_API_KEY` is set in Vercel. |

## 5. Not built (also listed in the README)

Re-encounter detection (underline saved words on pages), semantic clustering
(`/api/clusters` route exists, unaudited), daily digest email, offline capture queue.
