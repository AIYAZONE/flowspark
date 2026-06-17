-- 31. 日历订阅源（ICS Feed）表

CREATE TABLE IF NOT EXISTS public.calendar_feeds (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope text NOT NULL CHECK (scope IN ('user', 'goal')),
  goal_id uuid REFERENCES public.goals(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT calendar_feeds_scope_goal_valid CHECK (
    (scope = 'user' AND goal_id IS NULL) OR
    (scope = 'goal' AND goal_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS calendar_feeds_owner_idx ON public.calendar_feeds(owner_id);
CREATE INDEX IF NOT EXISTS calendar_feeds_token_idx ON public.calendar_feeds(token);
CREATE INDEX IF NOT EXISTS calendar_feeds_goal_idx ON public.calendar_feeds(goal_id);
CREATE UNIQUE INDEX IF NOT EXISTS calendar_feeds_owner_user_unique
  ON public.calendar_feeds(owner_id)
  WHERE scope = 'user';
CREATE UNIQUE INDEX IF NOT EXISTS calendar_feeds_owner_goal_unique
  ON public.calendar_feeds(owner_id, goal_id)
  WHERE scope = 'goal';

DROP TRIGGER IF EXISTS update_calendar_feeds_updated_at ON public.calendar_feeds;
CREATE TRIGGER update_calendar_feeds_updated_at
  BEFORE UPDATE ON public.calendar_feeds
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at_column();
