-- 07_inbox.sql
-- 灵感速记 Inbox：收集原始想法，后续可转为 Action 或归档

CREATE TABLE IF NOT EXISTS public.inbox_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  note text DEFAULT ''::text,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'open'::text,
  converted_action_id uuid REFERENCES public.actions(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT inbox_items_status_check CHECK (status IN ('open', 'archived'))
);

CREATE INDEX IF NOT EXISTS inbox_items_owner_status_created_at_idx
  ON public.inbox_items(owner_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS inbox_items_tags_gin_idx
  ON public.inbox_items USING GIN(tags);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_inbox_items_updated_at ON public.inbox_items;
CREATE TRIGGER update_inbox_items_updated_at
  BEFORE UPDATE ON public.inbox_items
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at_column();
