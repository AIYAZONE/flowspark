-- 32. 日历订阅源（ICS Feed）RLS 策略

ALTER TABLE public.calendar_feeds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calendar_feeds_owner_all" ON public.calendar_feeds;
CREATE POLICY "calendar_feeds_owner_all"
  ON public.calendar_feeds
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "calendar_feeds_public_read_active" ON public.calendar_feeds;
CREATE POLICY "calendar_feeds_public_read_active"
  ON public.calendar_feeds
  FOR SELECT
  USING (
    revoked_at IS NULL
    AND (expires_at IS NULL OR expires_at > now())
  );

