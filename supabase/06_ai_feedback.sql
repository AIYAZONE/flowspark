ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS ai_recent_events jsonb NOT NULL DEFAULT '[]'::jsonb;

