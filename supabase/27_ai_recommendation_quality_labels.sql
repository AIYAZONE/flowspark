alter table public.ai_recommendations
  add column if not exists quality_labels jsonb,
  add column if not exists strategy_summary jsonb;

comment on column public.ai_recommendations.quality_labels is 'Structured quality labels for the generated recommendation.';
comment on column public.ai_recommendations.strategy_summary is 'Structured summary of strategy decisions used before generation.';
