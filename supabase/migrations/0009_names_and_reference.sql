-- 1. Names. profiles.display_name already exists but nothing filled it.
--    New signups take it from the signup form (full_name) or Google
--    (full_name / name), falling back to the part of the email before the @.
--    This also keeps the 0008 behaviour: claim any pending space invites.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), '')
    )
  )
  on conflict (id) do nothing;

  if new.email is not null then
    insert into public.space_members (space_id, user_id, role)
    select space_id, new.id, 'member'
    from public.space_invites
    where email = lower(new.email)
    on conflict do nothing;

    delete from public.space_invites where email = lower(new.email);
  end if;

  return new;
end;
$$;

-- Backfill people who signed up before names existed.
update public.profiles
   set display_name = split_part(email, '@', 1)
 where display_name is null and email is not null and split_part(email, '@', 1) <> '';

-- 2. Reference layer: definition (dictionary) / encyclopedic summary (Wikipedia)
--    / contextual reading (the existing `explanation` column).
alter table public.captures add column if not exists encyclopedic_summary text;

-- 3. Moving a capture into a space must require membership of that space
--    (insert already did; update only checked ownership).
drop policy if exists captures_update_own on public.captures;
create policy captures_update_own on public.captures for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and (space_id is null or public.is_space_member(space_id)));
