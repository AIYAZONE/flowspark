-- 10_goal_entries_rls.sql
-- 为 goal_entries 启用并配置行级安全策略 (RLS)

ALTER TABLE public.goal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own goal entries" ON public.goal_entries;
CREATE POLICY "Users can view own goal entries" ON public.goal_entries
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert own goal entries" ON public.goal_entries;
CREATE POLICY "Users can insert own goal entries" ON public.goal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own goal entries" ON public.goal_entries;
CREATE POLICY "Users can update own goal entries" ON public.goal_entries
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete own goal entries" ON public.goal_entries;
CREATE POLICY "Users can delete own goal entries" ON public.goal_entries
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = owner_id);

