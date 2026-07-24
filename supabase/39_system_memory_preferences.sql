create extension if not exists pgcrypto;

create table if not exists public.system_memory_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  title text not null,
  description text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists system_memory_preferences_user_key
  on public.system_memory_preferences(user_id, key);

drop trigger if exists update_system_memory_preferences_updated_at on public.system_memory_preferences;
create trigger update_system_memory_preferences_updated_at
  before update on public.system_memory_preferences
  for each row
  execute procedure public.update_updated_at_column();

alter table public.system_memory_preferences enable row level security;

drop policy if exists "Users can view own system memory preferences" on public.system_memory_preferences;
create policy "Users can view own system memory preferences" on public.system_memory_preferences
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own system memory preferences" on public.system_memory_preferences;
create policy "Users can insert own system memory preferences" on public.system_memory_preferences
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own system memory preferences" on public.system_memory_preferences;
create policy "Users can update own system memory preferences" on public.system_memory_preferences
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own system memory preferences" on public.system_memory_preferences;
create policy "Users can delete own system memory preferences" on public.system_memory_preferences
  for delete using (auth.uid() = user_id);
