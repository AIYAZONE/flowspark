-- 08_inbox_rls.sql
-- 为 inbox_items 启用并配置行级安全策略 (RLS)

ALTER TABLE public.inbox_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own inbox items" ON public.inbox_items;
CREATE POLICY "Users can view own inbox items" ON public.inbox_items
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert own inbox items" ON public.inbox_items;
CREATE POLICY "Users can insert own inbox items" ON public.inbox_items
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own inbox items" ON public.inbox_items;
CREATE POLICY "Users can update own inbox items" ON public.inbox_items
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete own inbox items" ON public.inbox_items;
CREATE POLICY "Users can delete own inbox items" ON public.inbox_items
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = owner_id);
