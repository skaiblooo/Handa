-- Optional photo of the physical document, attached from the Add Document
-- flow. Stored in a private bucket (never public) since these can be
-- passports, licenses, government IDs — access is only ever via a
-- short-lived signed URL the client requests for its own documents.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('document-photos', 'document-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- storage.objects already has RLS enabled by Supabase itself; these
-- policies scope access to a per-user folder prefix (every upload path is
-- "{auth.uid()}/...", enforced client-side), mirroring the same
-- user_id-ownership pattern used everywhere else this week.
drop policy if exists "document_photos_select_own" on storage.objects;
create policy "document_photos_select_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'document-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "document_photos_insert_own" on storage.objects;
create policy "document_photos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'document-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "document_photos_update_own" on storage.objects;
create policy "document_photos_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'document-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'document-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "document_photos_delete_own" on storage.objects;
create policy "document_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'document-photos' and (storage.foldername(name))[1] = auth.uid()::text);

alter table public.documents add column if not exists photo_path text;
