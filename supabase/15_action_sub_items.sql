-- 15_action_sub_items.sql
-- 子行动表：关联父行动 actions

CREATE TABLE IF NOT EXISTS public.action_sub_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  action_id uuid NOT NULL REFERENCES public.actions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS action_sub_items_action_id_idx
  ON public.action_sub_items(action_id);

CREATE INDEX IF NOT EXISTS action_sub_items_user_id_idx
  ON public.action_sub_items(user_id);

CREATE INDEX IF NOT EXISTS action_sub_items_owner_id_idx
  ON public.action_sub_items(owner_id);

CREATE INDEX IF NOT EXISTS action_sub_items_action_sort_idx
  ON public.action_sub_items(action_id, sort_order);

DROP TRIGGER IF EXISTS update_action_sub_items_updated_at ON public.action_sub_items;
CREATE TRIGGER update_action_sub_items_updated_at
  BEFORE UPDATE ON public.action_sub_items
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
