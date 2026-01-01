-- 00_init_tables.sql
-- 初始化核心数据库表结构
-- 注意：为了兼容代码历史遗留逻辑，部分表同时包含 user_id 和 owner_id

-- 1. 用户资料表 (user_profiles)
-- 扩展 Supabase Auth 的用户信息
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    avatar_url text,
    timezone text DEFAULT 'UTC'::text,
    locale text DEFAULT 'en'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- 2. 目标表 (goals)
-- 存储用户的长期目标
CREATE TABLE IF NOT EXISTS public.goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- 兼容字段，代码主要使用此字段
    title text NOT NULL,
    description text,
    start_date date,
    end_date date,
    success_criteria text,
    stop_criteria text,
    status text DEFAULT 'active'::text,
    priority text DEFAULT 'medium'::text,
    category text DEFAULT 'other'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- 3. 行动/任务表 (actions)
-- 关联目标的具体行动项
CREATE TABLE IF NOT EXISTS public.actions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- 兼容字段
    goal_id uuid REFERENCES public.goals(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    type text,
    priority text DEFAULT 'medium'::text,
    completed boolean DEFAULT false,
    start_date date,
    end_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT actions_type_check CHECK (type IN ('core', 'maintenance', 'learning', 'review', 'rest'))
);

-- 4. 每日评分表 (daily_scores)
-- 记录用户每日状态评分
CREATE TABLE IF NOT EXISTS public.daily_scores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- 兼容字段，作为主键的一部分
    score_date date NOT NULL,
    score integer CHECK (score >= 0 AND score <= 5),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id),
    -- 复合唯一约束，确保每天只有一条记录 (代码中使用 onConflict: 'owner_id, score_date')
    CONSTRAINT daily_scores_owner_date_key UNIQUE (owner_id, score_date)
);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS goals_user_id_idx ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS goals_owner_id_idx ON public.goals(owner_id);
CREATE INDEX IF NOT EXISTS actions_user_id_idx ON public.actions(user_id);
CREATE INDEX IF NOT EXISTS actions_owner_id_idx ON public.actions(owner_id);
CREATE INDEX IF NOT EXISTS actions_goal_id_idx ON public.actions(goal_id);
CREATE INDEX IF NOT EXISTS daily_scores_owner_id_idx ON public.daily_scores(owner_id);
