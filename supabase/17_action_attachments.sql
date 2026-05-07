-- 17_action_attachments.sql
-- 行动附件（截图）与存储策略

create table if not exists public.action_attachments (
    id uuid primary key default gen_random_uuid(),
    action_id uuid not null references public.actions(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    owner_id uuid references auth.users(id) on delete cascade,
    bucket text not null default 'action-images',
    file_path text not null,
    public_url text not null,
    mime_type text,
    size_bytes bigint,
    created_at timestamptz not null default now()
);

create index if not exists action_attachments_action_id_idx on public.action_attachments(action_id);
create index if not exists action_attachments_owner_id_idx on public.action_attachments(owner_id);
create index if not exists action_attachments_user_id_idx on public.action_attachments(user_id);

alter table public.action_attachments enable row level security;

drop policy if exists "Users can view own action attachments" on public.action_attachments;
create policy "Users can view own action attachments"
    on public.action_attachments
    for select
    using (auth.uid() = user_id or auth.uid() = owner_id);

drop policy if exists "Users can insert own action attachments" on public.action_attachments;
create policy "Users can insert own action attachments"
    on public.action_attachments
    for insert
    with check (auth.uid() = user_id or auth.uid() = owner_id);

drop policy if exists "Users can update own action attachments" on public.action_attachments;
create policy "Users can update own action attachments"
    on public.action_attachments
    for update
    using (auth.uid() = user_id or auth.uid() = owner_id)
    with check (auth.uid() = user_id or auth.uid() = owner_id);

drop policy if exists "Users can delete own action attachments" on public.action_attachments;
create policy "Users can delete own action attachments"
    on public.action_attachments
    for delete
    using (auth.uid() = user_id or auth.uid() = owner_id);

insert into storage.buckets (id, name, public)
select 'action-images', 'action-images', true
where not exists (
    select 1 from storage.buckets where id = 'action-images'
);

update storage.buckets set public = true where id = 'action-images';

drop policy if exists "Public read action images" on storage.objects;
create policy "Public read action images"
on storage.objects for select
using (bucket_id = 'action-images');

drop policy if exists "Authenticated upload action images" on storage.objects;
create policy "Authenticated upload action images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'action-images' and owner = auth.uid());

drop policy if exists "Owner update action images" on storage.objects;
create policy "Owner update action images"
on storage.objects for update
to authenticated
using (bucket_id = 'action-images' and owner = auth.uid())
with check (bucket_id = 'action-images' and owner = auth.uid());

drop policy if exists "Owner delete action images" on storage.objects;
create policy "Owner delete action images"
on storage.objects for delete
to authenticated
using (bucket_id = 'action-images' and owner = auth.uid());
