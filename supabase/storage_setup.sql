-- Create public avatars bucket (compatible fallback)
insert into storage.buckets (id, name, public)
select 'avatars', 'avatars', true
where not exists (select 1 from storage.buckets where id = 'avatars');
-- Ensure public
update storage.buckets set public = true where id = 'avatars';

-- Clean up existing policies (avoid duplicates)
drop policy if exists "Public read avatars" on storage.objects;
drop policy if exists "Authenticated upload avatars" on storage.objects;
drop policy if exists "Owner update avatars" on storage.objects;
drop policy if exists "Owner delete avatars" on storage.objects;

-- Allow anyone to read files in the public avatars bucket
create policy "Public read avatars"
on storage.objects
for select
using (bucket_id = 'avatars');

-- Allow authenticated users to upload to avatars bucket
create policy "Authenticated upload avatars"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'avatars');

-- Allow owners to update their own avatar files in avatars bucket
create policy "Owner update avatars"
on storage.objects
for update
to authenticated
using (bucket_id = 'avatars' and owner = auth.uid())
with check (bucket_id = 'avatars' and owner = auth.uid());

-- Allow owners to delete their own avatar files in avatars bucket
create policy "Owner delete avatars"
on storage.objects
for delete
to authenticated
using (bucket_id = 'avatars' and owner = auth.uid());
