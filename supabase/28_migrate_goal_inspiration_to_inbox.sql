BEGIN;

INSERT INTO public.inbox_items (
  user_id,
  owner_id,
  content,
  note,
  tags,
  status,
  converted_action_id,
  created_at,
  updated_at
)
SELECT
  user_id,
  owner_id,
  content,
  COALESCE(note, ''::text),
  '{}'::text[],
  COALESCE(status, 'open'::text),
  converted_action_id,
  created_at,
  updated_at
FROM public.goal_entries
WHERE kind = 'inspiration';

DELETE FROM public.goal_entries
WHERE kind = 'inspiration';

COMMIT;
