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
