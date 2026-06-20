-- 38_ai_funnel_core_action_metrics.sql
-- Extend ai_funnel_daily with AI-attributed core action set/completed metrics.

create or replace view public.ai_funnel_daily
with (security_invoker = true) as
with expanded_events as (
  select
    up.id as user_id,
    event_item ->> 'name' as event_name,
    nullif(event_item -> 'meta' ->> 'scene', '') as scene,
    nullif(event_item -> 'meta' ->> 'variant', '') as variant,
    nullif(event_item -> 'meta' ->> 'source', '') as source,
    nullif(event_item -> 'meta' ->> 'recommendation_id', '') as recommendation_id,
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
),
event_aggregates as (
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
    coalesce(e.source, 'unknown')
),
apply_event_attribution as (
  select distinct on (
    e.user_id,
    e.recommendation_id,
    e.event_date,
    coalesce(e.scene, 'unknown'),
    coalesce(e.variant, '-'),
    coalesce(e.source, 'unknown')
  )
    e.user_id,
    e.recommendation_id::uuid as recommendation_id,
    e.event_date,
    coalesce(e.scene, 'unknown') as scene,
    coalesce(e.variant, '-') as variant,
    coalesce(e.source, 'unknown') as source
  from expanded_events e
  where e.event_name in ('ai_today_plan_apply', 'ai_rescue_apply')
    and e.recommendation_id is not null
  order by
    e.user_id,
    e.recommendation_id,
    e.event_date,
    coalesce(e.scene, 'unknown'),
    coalesce(e.variant, '-'),
    coalesce(e.source, 'unknown'),
    e.event_ts desc
),
core_action_outcomes as (
  select
    a.user_id,
    a.event_date,
    a.scene,
    a.variant,
    a.source,
    count(distinct o.action_id) filter (where act.type = 'core')::int as core_action_set_count,
    count(distinct o.action_id) filter (
      where act.type = 'core'
        and o.completed is true
    )::int as core_action_completed_count
  from apply_event_attribution a
  join public.ai_recommendation_outcomes o
    on o.user_id = a.user_id
   and o.recommendation_id = a.recommendation_id
  left join public.actions act
    on act.id = o.action_id
   and act.user_id = o.user_id
  group by
    a.user_id,
    a.event_date,
    a.scene,
    a.variant,
    a.source
)
select
  e.user_id,
  e.event_date,
  e.scene,
  e.variant,
  e.source,
  e.dashboard_view_count,
  e.today_view_count,
  e.today_plan_exposed_count,
  e.today_plan_click_count,
  e.today_plan_suggested_count,
  e.today_plan_apply_count,
  e.rescue_click_count,
  e.rescue_apply_count,
  e.review_exposed_count,
  e.review_click_count,
  e.review_generated_count,
  e.streak_risk_banner_exposed_count,
  e.returned_next_day,
  coalesce(c.core_action_set_count, 0)::int as core_action_set_count,
  coalesce(c.core_action_completed_count, 0)::int as core_action_completed_count
from event_aggregates e
left join core_action_outcomes c
  on c.user_id = e.user_id
 and c.event_date = e.event_date
 and c.scene = e.scene
 and c.variant = e.variant
 and c.source = e.source;

comment on view public.ai_funnel_daily is 'Daily AI funnel view derived from recent AI events and AI-attributed core action outcomes.';
