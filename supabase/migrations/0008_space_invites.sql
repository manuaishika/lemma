-- Pending invites: invite someone by email before they have a Lemma account.
-- When an account with that email is created, handle_new_user() turns every
-- matching invite into a space_members row and deletes the invite.

create table public.space_invites (
  id         uuid primary key default gen_random_uuid(),
  space_id   uuid not null references public.spaces (id) on delete cascade,
  email      text not null check (email = lower(email)),
  invited_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (space_id, email)
);

alter table public.space_invites enable row level security;

-- Only the space owner can see, create, or revoke invites.
create policy space_invites_select_by_owner on public.space_invites for select
  using (exists (select 1 from public.spaces s where s.id = space_id and s.owner_id = auth.uid()));
create policy space_invites_insert_by_owner on public.space_invites for insert
  with check (
    invited_by = auth.uid()
    and exists (select 1 from public.spaces s where s.id = space_id and s.owner_id = auth.uid())
  );
create policy space_invites_delete_by_owner on public.space_invites for delete
  using (exists (select 1 from public.spaces s where s.id = space_id and s.owner_id = auth.uid()));

-- Extend the signup trigger: profile row first, then claim pending invites.
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
