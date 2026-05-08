-- 23_ai_native_memory_rls.sql

alter table public.user_growth_profiles enable row level security;
alter table public.user_behavior_daily_snapshots enable row level security;
alter table public.user_friction_events enable row level security;

drop policy if exists "Users can view own user_growth_profiles" on public.user_growth_profiles;
create policy "Users can view own user_growth_profiles" on public.user_growth_profiles
  for select using (auth.uid() = user_id);

drop policy if exists "Users can upsert own user_growth_profiles" on public.user_growth_profiles;
create policy "Users can upsert own user_growth_profiles" on public.user_growth_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can view own behavior snapshots" on public.user_behavior_daily_snapshots;
create policy "Users can view own behavior snapshots" on public.user_behavior_daily_snapshots
  for select using (auth.uid() = user_id);

drop policy if exists "Users can upsert own behavior snapshots" on public.user_behavior_daily_snapshots;
create policy "Users can upsert own behavior snapshots" on public.user_behavior_daily_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can view own friction events" on public.user_friction_events;
create policy "Users can view own friction events" on public.user_friction_events
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own friction events" on public.user_friction_events;
create policy "Users can insert own friction events" on public.user_friction_events
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own friction events" on public.user_friction_events;
create policy "Users can update own friction events" on public.user_friction_events
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
