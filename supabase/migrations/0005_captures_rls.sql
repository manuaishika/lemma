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
