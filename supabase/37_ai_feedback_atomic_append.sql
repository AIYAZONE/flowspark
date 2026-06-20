-- 37_ai_feedback_atomic_append.sql
-- 用数据库原子追加 ai_recent_events，避免并发事件互相覆盖

create or replace function public.append_ai_feedback_event(
  p_name text,
  p_meta jsonb default null,
  p_ts timestamptz default now()
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.user_profiles
  set
    ai_recent_events = (
      with appended as (
        select value as item, ordinality::bigint as ord
        from jsonb_array_elements(coalesce(ai_recent_events, '[]'::jsonb)) with ordinality

        union all

        select
          jsonb_build_object(
            'name', p_name,
            'ts', p_ts,
            'meta', p_meta
          ) as item,
          9223372036854775807::bigint as ord
      ),
      trimmed as (
        select item, ord
        from appended
        order by ord desc
        limit 60
      )
      select coalesce(jsonb_agg(item order by ord), '[]'::jsonb)
      from trimmed
    ),
    updated_at = now()
  where id = auth.uid();

  if not found then
    raise exception 'profile_not_found';
  end if;
end;
$$;

grant execute on function public.append_ai_feedback_event(text, jsonb, timestamptz) to authenticated;
