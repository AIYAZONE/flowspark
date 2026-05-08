-- 21_user_behavior_daily_snapshots.sql

create extension if not exists pgcrypto;

create table if not exists public.user_behavior_daily_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_date date not null,
  actions_created int not null default 0,
  actions_completed int not null default 0,
  core_actions_completed int not null default 0,
  completion_rate numeric,
  daily_score int,
  momentum_bucket text,
  active_time_bucket text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, snapshot_date)
);

comment on table public.user_behavior_daily_snapshots is 'Stores daily behavior aggregates for coach context and analytics.';

create index if not exists idx_user_behavior_daily_snapshots_user_date
  on public.user_behavior_daily_snapshots(user_id, snapshot_date desc);

drop trigger if exists update_user_behavior_daily_snapshots_updated_at on public.user_behavior_daily_snapshots;
create trigger update_user_behavior_daily_snapshots_updated_at
  before update on public.user_behavior_daily_snapshots
  for each row
  execute procedure public.update_updated_at_column();
