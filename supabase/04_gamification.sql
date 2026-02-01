-- 04_gamification.sql
-- Phase 2: 最小游戏化数据结构（与现有代码对齐）

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS public.xp_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_id uuid REFERENCES public.actions(id) ON DELETE SET NULL,
  amount integer NOT NULL,
  source text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS xp_logs_user_created_at_idx ON public.xp_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS xp_logs_action_id_idx ON public.xp_logs(action_id);
