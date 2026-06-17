-- 33. 轻量系统通知中心（Notification Center）

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('shield_granted', 'milestone_reached', 'recovery_success')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key text NOT NULL,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT user_notifications_user_dedupe_unique UNIQUE (user_id, dedupe_key)
);

COMMENT ON TABLE public.user_notifications IS 'Durable per-user system notifications for traceability (separate from user inbox).';

CREATE INDEX IF NOT EXISTS user_notifications_user_created_idx
  ON public.user_notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS user_notifications_user_unread_idx
  ON public.user_notifications(user_id)
  WHERE read_at IS NULL;

DROP TRIGGER IF EXISTS update_user_notifications_updated_at ON public.user_notifications;
CREATE TRIGGER update_user_notifications_updated_at
  BEFORE UPDATE ON public.user_notifications
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at_column();
