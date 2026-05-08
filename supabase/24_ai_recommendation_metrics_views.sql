-- 24_ai_recommendation_metrics_views.sql

create or replace view public.ai_recommendation_scene_metrics
with (security_invoker = true) as
select
  r.user_id,
  r.scene,
  count(*)::int as recommendation_count,
  count(*) filter (where o.adopted is true)::int as adopted_count,
  count(*) filter (where o.completed is true)::int as completed_count,
  count(*) filter (where r.status = 'dismissed' or o.feedback_label = 'dismiss' or o.feedback_label = 'close_result')::int as dismissed_count,
  round(
    (count(*) filter (where o.adopted is true)::numeric / nullif(count(*), 0)),
    4
  ) as adoption_rate,
  round(
    (count(*) filter (where o.completed is true)::numeric / nullif(count(*), 0)),
    4
  ) as completion_rate,
  round(
    (count(*) filter (where r.fallback_used is true)::numeric / nullif(count(*), 0)),
    4
  ) as fallback_rate,
  round(
    avg(
      case r.confidence
        when 'low' then 1
        when 'medium' then 2
        when 'high' then 3
        else null
      end
    )::numeric,
    2
  ) as avg_confidence_score
from public.ai_recommendations r
left join public.ai_recommendation_outcomes o
  on o.recommendation_id = r.id
group by r.user_id, r.scene;

create or replace view public.ai_recommendation_strategy_metrics
with (security_invoker = true) as
select
  r.user_id,
  r.scene,
  r.strategy_version,
  r.prompt_version,
  count(*)::int as recommendation_count,
  count(*) filter (where o.adopted is true)::int as adopted_count,
  count(*) filter (where o.completed is true)::int as completed_count,
  count(*) filter (where r.status = 'dismissed' or o.feedback_label = 'dismiss' or o.feedback_label = 'close_result')::int as dismissed_count,
  round(
    (count(*) filter (where o.adopted is true)::numeric / nullif(count(*), 0)),
    4
  ) as adoption_rate,
  round(
    (count(*) filter (where o.completed is true)::numeric / nullif(count(*), 0)),
    4
  ) as completion_rate,
  round(
    (count(*) filter (where r.fallback_used is true)::numeric / nullif(count(*), 0)),
    4
  ) as fallback_rate,
  round(
    avg(
      case r.confidence
        when 'low' then 1
        when 'medium' then 2
        when 'high' then 3
        else null
      end
    )::numeric,
    2
  ) as avg_confidence_score
from public.ai_recommendations r
left join public.ai_recommendation_outcomes o
  on o.recommendation_id = r.id
group by r.user_id, r.scene, r.strategy_version, r.prompt_version;

create or replace view public.ai_recommendation_model_metrics
with (security_invoker = true) as
select
  r.user_id,
  r.scene,
  r.model,
  count(*)::int as recommendation_count,
  count(*) filter (where o.adopted is true)::int as adopted_count,
  count(*) filter (where o.completed is true)::int as completed_count,
  count(*) filter (where r.status = 'dismissed' or o.feedback_label = 'dismiss' or o.feedback_label = 'close_result')::int as dismissed_count,
  round(
    (count(*) filter (where o.adopted is true)::numeric / nullif(count(*), 0)),
    4
  ) as adoption_rate,
  round(
    (count(*) filter (where o.completed is true)::numeric / nullif(count(*), 0)),
    4
  ) as completion_rate,
  round(
    (count(*) filter (where r.fallback_used is true)::numeric / nullif(count(*), 0)),
    4
  ) as fallback_rate,
  round(
    avg(
      case r.confidence
        when 'low' then 1
        when 'medium' then 2
        when 'high' then 3
        else null
      end
    )::numeric,
    2
  ) as avg_confidence_score
from public.ai_recommendations r
left join public.ai_recommendation_outcomes o
  on o.recommendation_id = r.id
group by r.user_id, r.scene, r.model;
