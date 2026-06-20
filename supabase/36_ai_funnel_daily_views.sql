-- 36_ai_funnel_daily_views.sql

create or replace view public.ai_funnel_daily
with (security_invoker = true) as
with expanded_events as (
  select
    up.id as user_id,
    event_item ->> 'name' as event_name,
    nullif(event_item -> 'meta' ->> 'scene', '') as scene,
    nullif(event_item -> 'meta' ->> 'variant', '') as variant,
    nullif(event_item -> 'meta' ->> 'source', '') as source,
    (event_item ->> 'ts')::timestamptz as event_ts,
    ((event_item ->> 'ts')::timestamptz at time zone 'utc')::date as event_date
  from public.user_profiles up
  cross join lateral jsonb_array_elements(coalesce(up.ai_recent_events, '[]'::jsonb)) as event_item
  where event_item ? 'name'
    and event_item ? 'ts'
),
page_view_days as (
  select distinct
    user_id,
    event_date
  from expanded_events
  where event_name in ('dashboard_viewed', 'today_viewed')
)
select
  e.user_id,
  e.event_date,
  coalesce(e.scene, 'unknown') as scene,
  coalesce(e.variant, '-') as variant,
  coalesce(e.source, 'unknown') as source,
  count(*) filter (where e.event_name = 'dashboard_viewed')::int as dashboard_view_count,
  count(*) filter (where e.event_name = 'today_viewed')::int as today_view_count,
  count(*) filter (where e.event_name = 'ai_today_plan_exposed')::int as today_plan_exposed_count,
  count(*) filter (where e.event_name = 'ai_today_plan_click')::int as today_plan_click_count,
  count(*) filter (where e.event_name = 'ai_today_plan_suggested')::int as today_plan_suggested_count,
  count(*) filter (where e.event_name = 'ai_today_plan_apply')::int as today_plan_apply_count,
  count(*) filter (where e.event_name = 'ai_rescue_click')::int as rescue_click_count,
  count(*) filter (where e.event_name = 'ai_rescue_apply')::int as rescue_apply_count,
  count(*) filter (where e.event_name = 'ai_review_exposed')::int as review_exposed_count,
  count(*) filter (where e.event_name = 'ai_review_click')::int as review_click_count,
  count(*) filter (where e.event_name = 'ai_review_generated')::int as review_generated_count,
  count(*) filter (where e.event_name = 'streak_risk_banner_exposed')::int as streak_risk_banner_exposed_count,
  exists (
    select 1
    from page_view_days next_day
    where next_day.user_id = e.user_id
      and next_day.event_date = e.event_date + 1
  ) as returned_next_day
from expanded_events e
group by
  e.user_id,
  e.event_date,
  coalesce(e.scene, 'unknown'),
  coalesce(e.variant, '-'),
  coalesce(e.source, 'unknown');

comment on view public.ai_funnel_daily is 'Daily AI funnel view derived from recent AI events stored on user_profiles.';
