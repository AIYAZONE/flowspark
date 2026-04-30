-- 14. 潜力发掘会话 RLS 策略
ALTER TABLE public.potential_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own potential sessions" ON public.potential_sessions;
CREATE POLICY "Users can view own potential sessions"
    ON public.potential_sessions
    FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert own potential sessions" ON public.potential_sessions;
CREATE POLICY "Users can insert own potential sessions"
    ON public.potential_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own potential sessions" ON public.potential_sessions;
CREATE POLICY "Users can update own potential sessions"
    ON public.potential_sessions
    FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete own potential sessions" ON public.potential_sessions;
CREATE POLICY "Users can delete own potential sessions"
    ON public.potential_sessions
    FOR DELETE
    USING (auth.uid() = user_id OR auth.uid() = owner_id);

