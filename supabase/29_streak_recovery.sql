-- 29_streak_recovery.sql
-- Streak recovery + shield inventory for continuity rescue

create extension if not exists pgcrypto;

create table if not exists public.user_streak_benefits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  available_shields integer not null default 0 check (available_shields >= 0),
  last_shield_granted_for_streak integer,
  updated_at timestamptz not null default now()
);

comment on table public.user_streak_benefits is 'Stores per-user streak shield balance and latest grant threshold.';

drop trigger if exists update_user_streak_benefits_updated_at on public.user_streak_benefits;
create trigger update_user_streak_benefits_updated_at
  before update on public.user_streak_benefits
  for each row
  execute procedure public.update_updated_at_column();

create table if not exists public.streak_repairs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_date date not null,
  method text not null check (method in ('shield')),
  created_at timestamptz not null default now(),
  unique (user_id, target_date)
);

comment on table public.streak_repairs is 'Stores repaired streak dates that should count as continuous days.';

create index if not exists idx_streak_repairs_user_target_date
  on public.streak_repairs(user_id, target_date desc);

alter table public.user_streak_benefits enable row level security;
alter table public.streak_repairs enable row level security;

drop policy if exists "Users can view own streak benefits" on public.user_streak_benefits;
create policy "Users can view own streak benefits" on public.user_streak_benefits
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own streak benefits" on public.user_streak_benefits;
create policy "Users can insert own streak benefits" on public.user_streak_benefits
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own streak benefits" on public.user_streak_benefits;
create policy "Users can update own streak benefits" on public.user_streak_benefits
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own streak benefits" on public.user_streak_benefits;
create policy "Users can delete own streak benefits" on public.user_streak_benefits
  for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own streak repairs" on public.streak_repairs;
create policy "Users can view own streak repairs" on public.streak_repairs
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own streak repairs" on public.streak_repairs;
create policy "Users can insert own streak repairs" on public.streak_repairs
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own streak repairs" on public.streak_repairs;
create policy "Users can update own streak repairs" on public.streak_repairs
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own streak repairs" on public.streak_repairs;
create policy "Users can delete own streak repairs" on public.streak_repairs
  for delete using (auth.uid() = user_id);
