-- 11. 目标分享（只读）表
CREATE TABLE IF NOT EXISTS public.goal_shares (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_id uuid REFERENCES public.goals(id) ON DELETE CASCADE,
    token text NOT NULL UNIQUE,
    snapshot jsonb NOT NULL,
    expires_at timestamp with time zone,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT goal_shares_owner_goal_key UNIQUE (owner_id, goal_id)
);

CREATE INDEX IF NOT EXISTS goal_shares_owner_idx ON public.goal_shares(owner_id);
CREATE INDEX IF NOT EXISTS goal_shares_token_idx ON public.goal_shares(token);
CREATE INDEX IF NOT EXISTS goal_shares_goal_idx ON public.goal_shares(goal_id);

