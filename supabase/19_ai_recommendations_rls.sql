-- 19_ai_recommendations_rls.sql
-- RLS policies for AI recommendation tracking tables

alter table public.ai_recommendations enable row level security;
alter table public.ai_recommendation_outcomes enable row level security;

drop policy if exists "Users can view own ai_recommendations" on public.ai_recommendations;
create policy "Users can view own ai_recommendations" on public.ai_recommendations
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own ai_recommendations" on public.ai_recommendations;
create policy "Users can insert own ai_recommendations" on public.ai_recommendations
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own ai_recommendations" on public.ai_recommendations;
create policy "Users can update own ai_recommendations" on public.ai_recommendations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can view own ai_recommendation_outcomes" on public.ai_recommendation_outcomes;
create policy "Users can view own ai_recommendation_outcomes" on public.ai_recommendation_outcomes
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own ai_recommendation_outcomes" on public.ai_recommendation_outcomes;
create policy "Users can insert own ai_recommendation_outcomes" on public.ai_recommendation_outcomes
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own ai_recommendation_outcomes" on public.ai_recommendation_outcomes;
create policy "Users can update own ai_recommendation_outcomes" on public.ai_recommendation_outcomes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
