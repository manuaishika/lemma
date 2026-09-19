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
| **"Lemma forces you to write one sentence… the moment you save it"** | 🔴 **False today** | The note is optional: API stores `user_note ?? null`, popup saves `note.trim() \|\| null`. The brief says it's the one required field. |
| Explanation of how a word is used in *this* passage | ❓ | Code calls Claude (`lib/explain.ts`) only if `ANTHROPIC_API_KEY` is set. Can't see Vercel env; without it users silently get the dictionary. |
| …**plus a plain dictionary definition** | 🟡 | Dictionary lookup exists but is wired as a *fallback*, not shown alongside the explanation. |
| Spaced review — Again / Hard / Good / Easy — for every capture type | 🟢 | Review UI + `/api/review`; no per-type filter. **Intervals don't match the brief's SM-2 — see §3.** |
| Spaces: "invite someone by email" | 🟡 | Only works if they **already have a Lemma account**; otherwise 404 "No Lemma account with that email yet." No pending invite, no invite email. |
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
| SM-2 with the brief's constants | 🔴 | **Different constants — §3.** |
| Extension ↔ web session handoff | 🟢 | `externally_connectable` is patched from `LEMMA_API_BASE` at build. Must package with the Vercel URL (`pnpm --filter @lemma/extension package` refuses localhost). |
| P2 — Chrome Web Store | 🔴 | Zip script ✅, `/privacy` page ✅. Needs a developer account ($5), store screenshots and listing copy. |
| P2 — Play Store | 🔴 | Not started. |

## 3. Decisions needed (these change what we promise)

1. **Make the note required?** Brief says yes and the landing page already claims it.
   *Recommend: yes* — block save in popup + API when the note is empty.
2. **SM-2 constants.** Brief: "do not change the constants." Repo uses textbook SM-2 instead:

   | Grade | Brief ease Δ | Repo ease Δ |
   |---|---|---|
   | Again | −0.20 | −0.32 |
   | Hard | −0.15 | −0.14 |
   | Good | 0 | 0 |
   | Easy | +0.15 | +0.10 |

   Also: the brief computes the next interval with the *old* ease, the repo with the *new* one,
   and the brief counts `lapses`, the repo doesn't. Existing tests encode the repo's version.
   *Recommend: match the brief, update tests* — it's the stated spec and no users exist yet.
3. **Invites for people without an account.** Either store a pending invite that resolves on
   signup, or change the landing line to "invite someone who has a Lemma account."
   *Recommend: pending invites* (the feature is meaningless if the friend can't be invited first).

## 4. Built but not live

| Feature | To turn it on |
|---|---|
| Reminder emails (3 days after a capture) | Run `supabase/migrations/0007_reminders.sql` on the cloud DB; set `RESEND_API_KEY`, `LEMMA_REMINDER_FROM`, `CRON_SECRET` in Vercel; redeploy. |
| Google sign-in | Google Cloud OAuth client → Supabase Auth → Providers → Google; add `https://lemma-web-dun.vercel.app/auth/callback` to redirect URLs. |
| Context explanations | Confirm `ANTHROPIC_API_KEY` is set in Vercel. |

## 5. Not built (also listed in the README)

Re-encounter detection (underline saved words on pages), semantic clustering
(`/api/clusters` route exists, unaudited), daily digest email, offline capture queue.
