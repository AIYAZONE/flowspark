-- Enable RLS on tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_scores ENABLE ROW LEVEL SECURITY;

-- user_profiles policies
CREATE POLICY user_profiles_select ON public.user_profiles
FOR SELECT USING (id = auth.uid());

CREATE POLICY user_profiles_insert ON public.user_profiles
FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY user_profiles_update ON public.user_profiles
FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY user_profiles_delete ON public.user_profiles
FOR DELETE USING (id = auth.uid());

-- goals policies
CREATE POLICY goals_select ON public.goals
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY goals_insert ON public.goals
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY goals_update ON public.goals
FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY goals_delete ON public.goals
FOR DELETE USING (user_id = auth.uid());

-- actions policies
CREATE POLICY actions_select ON public.actions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY actions_insert ON public.actions
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY actions_update ON public.actions
FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY actions_delete ON public.actions
FOR DELETE USING (user_id = auth.uid());

-- daily_scores policies
CREATE POLICY daily_scores_select ON public.daily_scores
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY daily_scores_insert ON public.daily_scores
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY daily_scores_update ON public.daily_scores
FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY daily_scores_delete ON public.daily_scores
FOR DELETE USING (user_id = auth.uid());
