-- 34. 轻量系统通知中心 RLS 策略

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_notifications_user_select" ON public.user_notifications;
CREATE POLICY "user_notifications_user_select"
  ON public.user_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_notifications_user_insert" ON public.user_notifications;
CREATE POLICY "user_notifications_user_insert"
  ON public.user_notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_notifications_user_update" ON public.user_notifications;
CREATE POLICY "user_notifications_user_update"
  ON public.user_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_notifications_user_delete" ON public.user_notifications;
CREATE POLICY "user_notifications_user_delete"
  ON public.user_notifications
  FOR DELETE
  USING (auth.uid() = user_id);
