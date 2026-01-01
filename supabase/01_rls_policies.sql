-- 01_rls_policies.sql
-- 启用并配置行级安全策略 (Row Level Security)

-- 1. 启用 RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_scores ENABLE ROW LEVEL SECURITY;

-- 2. user_profiles 策略
-- 用户只能查看和修改自己的资料
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- 3. goals 策略
-- 检查 user_id 或 owner_id 匹配
CREATE POLICY "Users can view own goals" ON public.goals
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = owner_id);

CREATE POLICY "Users can insert own goals" ON public.goals
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = owner_id);

CREATE POLICY "Users can update own goals" ON public.goals
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = owner_id);

CREATE POLICY "Users can delete own goals" ON public.goals
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() = owner_id);

-- 4. actions 策略
CREATE POLICY "Users can view own actions" ON public.actions
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = owner_id);

CREATE POLICY "Users can insert own actions" ON public.actions
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = owner_id);

CREATE POLICY "Users can update own actions" ON public.actions
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = owner_id);

CREATE POLICY "Users can delete own actions" ON public.actions
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() = owner_id);

-- 5. daily_scores 策略
CREATE POLICY "Users can view own scores" ON public.daily_scores
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = owner_id);

CREATE POLICY "Users can insert own scores" ON public.daily_scores
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = owner_id);

CREATE POLICY "Users can update own scores" ON public.daily_scores
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = owner_id);

CREATE POLICY "Users can delete own scores" ON public.daily_scores
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() = owner_id);
