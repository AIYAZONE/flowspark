-- 22_user_friction_events.sql

create extension if not exists pgcrypto;

create table if not exists public.user_friction_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  action_id uuid references public.actions(id) on delete set null,
  scene text not null,
  reason_tag text not null,
  detail text,
  created_at timestamptz not null default now(),
  constraint user_friction_events_scene_check
    check (scene in ('today_plan', 'rescue', 'review', 'weekly_insight'))
);

comment on table public.user_friction_events is 'Stores structured friction and interruption signals for AI coaching.';

create index if not exists idx_user_friction_events_user_created
  on public.user_friction_events(user_id, created_at desc);

create index if not exists idx_user_friction_events_reason_tag
  on public.user_friction_events(reason_tag);
