-- Lemma core schema: 7 tables.
-- Philosophy note: `words.explanation` is disposable scaffolding;
-- `words.user_note` is the artifact.

create extension if not exists vector with schema extensions;

-- 1. profiles -------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  display_name text,
  settings     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

-- 2. words --------------------------------------------------------------
create table public.words (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users (id) on delete cascade,
  text                  text not null,
  entry_type            text not null default 'term' check (entry_type in ('term', 'note')),
  sentence              text,
  page_title            text,
  source_url            text,
  explanation           text,
  dictionary_definition text,
  user_note             text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index words_user_created_idx on public.words (user_id, created_at desc);
create index words_user_lower_text_idx on public.words (user_id, lower(text));

-- 3. srs_cards --------------------------------------------------------
create table public.srs_cards (
  id               uuid primary key default gen_random_uuid(),
  word_id          uuid not null unique references public.words (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  ease_factor      real not null default 2.5,
  interval_days    integer not null default 0,
  repetitions      integer not null default 0,
  due_at           timestamptz not null default now(),
  last_reviewed_at timestamptz
);
create index srs_cards_due_idx on public.srs_cards (user_id, due_at);

-- 4. review_logs ---------------------------------------------------
create table public.review_logs (
  id            uuid primary key default gen_random_uuid(),
  card_id       uuid not null references public.srs_cards (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  grade         smallint not null check (grade between 0 and 3),
  prev_interval integer not null,
  new_interval  integer not null,
  prev_ease     real not null,
  new_ease      real not null,
  reviewed_at   timestamptz not null default now()
);
create index review_logs_card_idx on public.review_logs (card_id, reviewed_at desc);

-- 5. word_embeddings (populated in a later pass) ------------------
create table public.word_embeddings (
  word_id    uuid primary key references public.words (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  embedding  extensions.vector(1536) not null,
  model      text not null,
  created_at timestamptz not null default now()
);

-- 6. clusters (later pass) -------------------------------------
create table public.clusters (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  centroid   extensions.vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. word_clusters (later pass) ------------------------------
create table public.word_clusters (
  word_id    uuid not null references public.words (id) on delete cascade,
  cluster_id uuid not null references public.clusters (id) on delete cascade,
  distance   real,
  primary key (word_id, cluster_id)
);

-- keep words.updated_at honest
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger words_touch_updated_at
  before update on public.words
  for each row execute function public.touch_updated_at();
-- Structural guarantees:
--   * every auth user gets a profiles row
--   * every word gets exactly one srs_cards row, created in the same txn as the word
--     (this is why the app never has to mint card ids -- no drift possible)

-- profile on signup ----------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- srs card on word insert -------------------------------------------
create or replace function public.handle_new_word()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.srs_cards (word_id, user_id, due_at)
  values (new.id, new.user_id, now())
  on conflict (word_id) do nothing;
  return new;
end;
$$;

create trigger on_word_created
  after insert on public.words
  for each row execute function public.handle_new_word();

-- one-shot review RPC: advance the card + write the log atomically -----
create or replace function public.apply_review(
  p_card_id       uuid,
  p_grade         smallint,
  p_ease_factor   real,
  p_interval_days integer,
  p_repetitions   integer,
  p_due_at        timestamptz
)
returns public.srs_cards
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_card public.srs_cards;
begin
  select * into v_card from public.srs_cards where id = p_card_id for update;
  if not found then
    raise exception 'card % not found', p_card_id;
  end if;

  insert into public.review_logs
    (card_id, user_id, grade, prev_interval, new_interval, prev_ease, new_ease)
  values
    (v_card.id, v_card.user_id, p_grade, v_card.interval_days, p_interval_days,
     v_card.ease_factor, p_ease_factor);

  update public.srs_cards
     set ease_factor      = p_ease_factor,
         interval_days    = p_interval_days,
         repetitions      = p_repetitions,
         due_at           = p_due_at,
         last_reviewed_at = now()
   where id = p_card_id
   returning * into v_card;

  return v_card;
end;
$$;
-- Row-level security: a user can only ever touch their own rows.

alter table public.profiles       enable row level security;
alter table public.words          enable row level security;
alter table public.srs_cards      enable row level security;
alter table public.review_logs    enable row level security;
alter table public.word_embeddings enable row level security;
alter table public.clusters       enable row level security;
alter table public.word_clusters  enable row level security;

-- profiles (keyed on id) --------------------------------------------
create policy "profiles: self read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: self write"  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- helper: same policy shape for every user_id-scoped table
do $$
declare
  t text;
begin
  foreach t in array array[
    'words', 'srs_cards', 'review_logs', 'word_embeddings', 'clusters'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select using (auth.uid() = user_id)',
      t || '_self_select', t);
    execute format(
      'create policy %I on public.%I for insert with check (auth.uid() = user_id)',
      t || '_self_insert', t);
    execute format(
      'create policy %I on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t || '_self_update', t);
    execute format(
      'create policy %I on public.%I for delete using (auth.uid() = user_id)',
      t || '_self_delete', t);
  end loop;
end $$;

-- word_clusters: authorize through the parent word
create policy "word_clusters: self select" on public.word_clusters for select
  using (exists (select 1 from public.words w where w.id = word_id and w.user_id = auth.uid()));
create policy "word_clusters: self insert" on public.word_clusters for insert
  with check (exists (select 1 from public.words w where w.id = word_id and w.user_id = auth.uid()));
create policy "word_clusters: self delete" on public.word_clusters for delete
  using (exists (select 1 from public.words w where w.id = word_id and w.user_id = auth.uid()));
-- Generalize the vocabulary vault into a general capture model:
-- term | note | screenshot | link, optionally living in a shared space.

alter table public.words rename to captures;

alter table public.captures rename column entry_type to capture_type;
alter table public.captures drop constraint words_entry_type_check;
alter table public.captures add constraint captures_capture_type_check
  check (capture_type in ('term', 'note', 'screenshot', 'link'));

alter table public.captures add column image_path text;
alter table public.captures add column link_url text;

-- spaces: async shared folders. Not live co-editing -- members add captures,
-- everyone sees them on refresh.
create table public.spaces (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

create table public.space_members (
  space_id   uuid not null references public.spaces (id) on delete cascade,
  -- FK targets profiles (not auth.users) so PostgREST can embed
  -- `profile:profiles(...)` on this table; every auth user has a profiles
  -- row from the moment they sign up (handle_new_user), so this is always
  -- satisfiable.
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (space_id, user_id)
);

alter table public.captures add column space_id uuid references public.spaces (id) on delete set null;
create index captures_space_idx on public.captures (space_id, created_at desc);

-- a space's owner is also its first member, for uniform membership checks
create or replace function public.handle_new_space()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.space_members (space_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger on_space_created
  after insert on public.spaces
  for each row execute function public.handle_new_space();

-- rename word_id -> capture_id everywhere it appears (review_logs references
-- srs_cards by card_id, not word_id, so it's untouched)
alter table public.srs_cards rename column word_id to capture_id;
alter table public.word_embeddings rename column word_id to capture_id;
alter table public.word_clusters rename column word_id to capture_id;

-- a shared capture can be reviewed independently by each member later --
-- the schema shouldn't forbid that even though this pass only creates a
-- card for the capture's own author.
alter table public.srs_cards drop constraint srs_cards_word_id_key;
alter table public.srs_cards add constraint srs_cards_capture_user_key unique (capture_id, user_id);

drop trigger on_word_created on public.captures;
drop function public.handle_new_word();

create or replace function public.handle_new_capture()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.srs_cards (capture_id, user_id, due_at)
  values (new.id, new.user_id, now())
  on conflict (capture_id, user_id) do nothing;
  return new;
end;
$$;

create trigger on_capture_created
  after insert on public.captures
  for each row execute function public.handle_new_capture();

drop trigger words_touch_updated_at on public.captures;
create trigger captures_touch_updated_at
  before update on public.captures
  for each row execute function public.touch_updated_at();

-- apply_review referenced srs_cards by shape only, but recreate it to be
-- explicit about the renamed column and unique key it relies on.
create or replace function public.apply_review(
  p_card_id       uuid,
  p_grade         smallint,
  p_ease_factor   real,
  p_interval_days integer,
  p_repetitions   integer,
  p_due_at        timestamptz
)
returns public.srs_cards
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_card public.srs_cards;
begin
  select * into v_card from public.srs_cards where id = p_card_id for update;
  if not found then
    raise exception 'card % not found', p_card_id;
  end if;

  insert into public.review_logs
    (card_id, user_id, grade, prev_interval, new_interval, prev_ease, new_ease)
  values
    (v_card.id, v_card.user_id, p_grade, v_card.interval_days, p_interval_days,
     v_card.ease_factor, p_ease_factor);

  update public.srs_cards
     set ease_factor      = p_ease_factor,
         interval_days    = p_interval_days,
         repetitions      = p_repetitions,
         due_at           = p_due_at,
         last_reviewed_at = now()
   where id = p_card_id
   returning * into v_card;

  return v_card;
end;
$$;

-- resolve an invite email to a user id without exposing the rest of profiles
create or replace function public.lookup_user_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.profiles where lower(email) = lower(p_email) limit 1;
$$;

revoke all on function public.lookup_user_by_email(text) from public;
grant execute on function public.lookup_user_by_email(text) to authenticated;
-- Replace the old owner-only policies on captures (still named words_* --
-- table renames don't rename policies) with owner-OR-space-member rules,
-- and add RLS for the two new tables.
--
-- Every "is this space_id/user_id pair a member" check below goes through
-- is_space_member() rather than an inline EXISTS on space_members. A
-- policy that queries its own table directly causes Postgres to reapply
-- that same policy to the subquery -> infinite recursion. A `security
-- definer` function (owned by postgres, which RLS doesn't apply to by
-- default) breaks the cycle.

create or replace function public.is_space_member(p_space_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.space_members sm
    where sm.space_id = p_space_id and sm.user_id = p_user_id
  );
$$;

revoke all on function public.is_space_member(uuid, uuid) from public;
grant execute on function public.is_space_member(uuid, uuid) to authenticated;

drop policy words_self_select on public.captures;
drop policy words_self_insert on public.captures;
drop policy words_self_update on public.captures;
drop policy words_self_delete on public.captures;

create policy captures_visible_to_owner_or_space
  on public.captures for select
  using (
    auth.uid() = user_id
    or (space_id is not null and public.is_space_member(space_id))
  );

create policy captures_insert_own_or_as_space_member
  on public.captures for insert
  with check (
    auth.uid() = user_id
    and (space_id is null or public.is_space_member(space_id))
  );

-- Author-only for now: a collaborator can add to a space but not edit or
-- delete someone else's capture yet.
create policy captures_update_own on public.captures for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy captures_delete_own on public.captures for delete
  using (auth.uid() = user_id);

alter table public.spaces enable row level security;
alter table public.space_members enable row level security;

-- auth.uid() = owner_id is checked directly (not via is_space_member) so
-- that INSERT ... RETURNING can see the just-created row immediately --
-- the owner's own space_members row is added by an AFTER INSERT trigger
-- within the same statement, and RETURNING's SELECT-policy check runs
-- against a stable-function snapshot from before that trigger fires.
create policy spaces_select_if_member on public.spaces for select
  using (auth.uid() = owner_id or public.is_space_member(id));
create policy spaces_insert_own on public.spaces for insert
  with check (auth.uid() = owner_id);
create policy spaces_update_own on public.spaces for update
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy spaces_delete_own on public.spaces for delete
  using (auth.uid() = owner_id);

-- Visible to any fellow member of the same space (so the settings page can
-- list everyone, not just the caller's own row).
create policy space_members_select_if_fellow_member on public.space_members for select
  using (public.is_space_member(space_id));
create policy space_members_insert_by_owner on public.space_members for insert
  with check (exists (
    select 1 from public.spaces s where s.id = space_id and s.owner_id = auth.uid()
  ));
create policy space_members_delete_by_owner on public.space_members for delete
  using (exists (
    select 1 from public.spaces s where s.id = space_id and s.owner_id = auth.uid()
  ));

-- Let a space member see the email/display_name of a fellow member (needed
-- for the space settings page) without opening profiles up generally.
create policy profiles_visible_to_space_cohabitants on public.profiles for select
  using (exists (
    select 1 from public.space_members a
    where a.user_id = profiles.id and public.is_space_member(a.space_id)
  ));
-- Private bucket for screenshot captures. Objects live at
-- "{auth.uid()}/{capture id}.png" -- direct storage access is owner-only;
-- a space member views another member's screenshot through the
-- GET /api/captures/:id/image proxy (service-role signed URL), not directly.

insert into storage.buckets (id, name, public)
values ('captures', 'captures', false)
on conflict (id) do nothing;

create policy captures_bucket_owner_insert on storage.objects for insert
  with check (
    bucket_id = 'captures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy captures_bucket_owner_select on storage.objects for select
  using (
    bucket_id = 'captures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy captures_bucket_owner_delete on storage.objects for delete
  using (
    bucket_id = 'captures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
