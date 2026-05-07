-- 16_action_sub_items_rls.sql
-- 为 action_sub_items 启用并配置行级安全策略 (RLS)

ALTER TABLE public.action_sub_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own action sub items" ON public.action_sub_items;
CREATE POLICY "Users can view own action sub items" ON public.action_sub_items
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert own action sub items" ON public.action_sub_items;
CREATE POLICY "Users can insert own action sub items" ON public.action_sub_items
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own action sub items" ON public.action_sub_items;
CREATE POLICY "Users can update own action sub items" ON public.action_sub_items
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete own action sub items" ON public.action_sub_items;
CREATE POLICY "Users can delete own action sub items" ON public.action_sub_items
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = owner_id);
