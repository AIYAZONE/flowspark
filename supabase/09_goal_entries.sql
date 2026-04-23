-- 09_goal_entries.sql
-- 目标内子项：灵感 / 心路旅程（可转为 Action）

CREATE TABLE IF NOT EXISTS public.goal_entries (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id uuid REFERENCES public.goals(id) ON DELETE CASCADE,
  kind text NOT NULL,
  content text NOT NULL,
  note text DEFAULT ''::text,
  status text NOT NULL DEFAULT 'open'::text,
  converted_action_id uuid REFERENCES public.actions(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT goal_entries_kind_check CHECK (kind IN ('inspiration', 'journey')),
  CONSTRAINT goal_entries_status_check CHECK (status IN ('open', 'archived'))
);

CREATE INDEX IF NOT EXISTS goal_entries_owner_goal_kind_status_created_at_idx
  ON public.goal_entries(owner_id, goal_id, kind, status, created_at DESC);

DROP TRIGGER IF EXISTS update_goal_entries_updated_at ON public.goal_entries;
CREATE TRIGGER update_goal_entries_updated_at
  BEFORE UPDATE ON public.goal_entries
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

