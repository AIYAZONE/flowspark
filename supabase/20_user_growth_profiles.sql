-- 20_user_growth_profiles.sql

create extension if not exists pgcrypto;

create table if not exists public.user_growth_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  primary_goal_area text,
  motivation_style text,
  preferred_time_bucket text,
  difficulty_tolerance text,
  risk_of_dropout text,
  current_stage text,
  summary text,
  updated_at timestamptz not null default now()
);

comment on table public.user_growth_profiles is 'Stores stable or slowly changing growth coach profile fields.';

drop trigger if exists update_user_growth_profiles_updated_at on public.user_growth_profiles;
create trigger update_user_growth_profiles_updated_at
  before update on public.user_growth_profiles
  for each row
  execute procedure public.update_updated_at_column();
