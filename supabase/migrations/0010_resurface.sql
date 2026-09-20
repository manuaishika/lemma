-- How a capture comes back: 'review' (graded), 'revisit' (gentle reminder, no
-- grading) or 'keep' (never resurfaces). NULL means "use the default for this
-- capture type" -- words and screenshots review, passages and links revisit --
-- so existing captures need no backfill.
alter table public.captures
  add column if not exists resurface text check (resurface in ('review', 'revisit', 'keep'));
