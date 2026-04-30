-- 12. 目标分享（只读）RLS 策略
ALTER TABLE public.goal_shares ENABLE ROW LEVEL SECURITY;

-- 所有者可管理自己的分享记录
DROP POLICY IF EXISTS "goal_shares_owner_all" ON public.goal_shares;
CREATE POLICY "goal_shares_owner_all"
    ON public.goal_shares
    FOR ALL
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- 任何人可读取未撤销且未过期的分享（仅凭 token）
DROP POLICY IF EXISTS "goal_shares_public_read_active" ON public.goal_shares;
CREATE POLICY "goal_shares_public_read_active"
    ON public.goal_shares
    FOR SELECT
    USING (
        revoked_at IS NULL
        AND (expires_at IS NULL OR expires_at > now())
    );

