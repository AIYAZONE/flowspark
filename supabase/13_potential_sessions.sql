-- 13. 潜力发掘会话（完整快照）表
CREATE TABLE IF NOT EXISTS public.potential_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_input text NOT NULL,
    goal_input text NOT NULL,
    result_json jsonb NOT NULL,
    created_actions_json jsonb NOT NULL DEFAULT '[]'::jsonb,
    status text NOT NULL DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS potential_sessions_owner_created_idx
    ON public.potential_sessions(owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS potential_sessions_user_created_idx
    ON public.potential_sessions(user_id, created_at DESC);

