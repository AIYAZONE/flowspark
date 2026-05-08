-- 25_ai_recommendation_recent_view.sql

create or replace view public.ai_recommendation_recent_view
with (security_invoker = true) as
select
  r.user_id,
  r.id as recommendation_id,
  r.scene,
  r.strategy_version,
  r.prompt_version,
  r.model,
  r.confidence,
  r.status,
  r.fallback_used,
  o.adopted,
  o.completed,
  o.option_selected,
  o.feedback_label,
  r.created_at
from public.ai_recommendations r
left join public.ai_recommendation_outcomes o
  on o.recommendation_id = r.id
order by r.created_at desc;
