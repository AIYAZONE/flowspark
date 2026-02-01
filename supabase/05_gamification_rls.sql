-- 05_gamification_rls.sql
-- Phase 2: gamification tables RLS policies

ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own xp logs" ON public.xp_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own xp logs" ON public.xp_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own xp logs" ON public.xp_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own xp logs" ON public.xp_logs
  FOR DELETE USING (auth.uid() = user_id);
