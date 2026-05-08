-- 26_ai_analytics_view_permissions.sql

grant select on public.ai_recommendation_scene_metrics to authenticated;
grant select on public.ai_recommendation_strategy_metrics to authenticated;
grant select on public.ai_recommendation_model_metrics to authenticated;
grant select on public.ai_recommendation_recent_view to authenticated;
