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
