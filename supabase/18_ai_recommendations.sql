-- 18_ai_recommendations.sql
-- AI recommendations and outcome tracking for Phase A

create extension if not exists pgcrypto;

create table if not exists public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scene text not null,
  strategy_version text not null default 'phase_a_v1',
  prompt_version text not null default 'today_plan_v1',
  model text not null,
  input_summary jsonb,
  output_payload jsonb not null,
  confidence text,
  status text not null default 'generated',
  fallback_used boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_recommendations_scene_check
    check (scene in ('today_plan', 'rescue', 'review', 'goal_setup', 'weekly_insight')),
  constraint ai_recommendations_confidence_check
    check (confidence is null or confidence in ('low', 'medium', 'high')),
  constraint ai_recommendations_status_check
    check (status in ('generated', 'adopted', 'completed', 'dismissed', 'expired', 'failed'))
);

create table if not exists public.ai_recommendation_outcomes (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.ai_recommendations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  action_id uuid references public.actions(id) on delete set null,
  adopted boolean,
  option_selected text,
  completed boolean,
  completion_minutes int,
  feedback_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_recommendation_outcomes_option_check
    check (option_selected is null or option_selected in ('5m', '10m', '20m')),
  constraint ai_recommendation_outcomes_completion_minutes_check
    check (completion_minutes is null or completion_minutes >= 0)
);

comment on table public.ai_recommendations is 'Stores each AI-generated recommendation for replay and analysis.';
comment on column public.ai_recommendations.input_summary is 'Lightweight summary of context used to generate the recommendation.';
comment on column public.ai_recommendations.output_payload is 'Structured AI output JSON payload.';
comment on column public.ai_recommendations.fallback_used is 'Whether the recommendation came from fallback logic instead of the model.';

comment on table public.ai_recommendation_outcomes is 'Tracks whether a recommendation was adopted, completed, or dismissed.';
comment on column public.ai_recommendation_outcomes.option_selected is 'Selected recommendation size variant such as 5m, 10m, or 20m.';
comment on column public.ai_recommendation_outcomes.feedback_label is 'User feedback label such as dismiss, skip, or too_hard.';

alter table public.actions
  add column if not exists ai_recommendation_id uuid references public.ai_recommendations(id) on delete set null;

create index if not exists idx_actions_ai_recommendation_id
  on public.actions(ai_recommendation_id);

create index if not exists idx_ai_recommendations_user_id
  on public.ai_recommendations(user_id);

create index if not exists idx_ai_recommendations_scene
  on public.ai_recommendations(scene);

create index if not exists idx_ai_recommendations_created_at
  on public.ai_recommendations(created_at desc);

create index if not exists idx_ai_recommendations_user_scene_created
  on public.ai_recommendations(user_id, scene, created_at desc);

create index if not exists idx_ai_recommendation_outcomes_user_id
  on public.ai_recommendation_outcomes(user_id);

create index if not exists idx_ai_recommendation_outcomes_action_id
  on public.ai_recommendation_outcomes(action_id);

create index if not exists idx_ai_recommendation_outcomes_created_at
  on public.ai_recommendation_outcomes(created_at desc);

create unique index if not exists uq_ai_recommendation_outcomes_recommendation_id
  on public.ai_recommendation_outcomes(recommendation_id);

drop trigger if exists update_ai_recommendations_updated_at on public.ai_recommendations;
create trigger update_ai_recommendations_updated_at
  before update on public.ai_recommendations
  for each row
  execute procedure public.update_updated_at_column();

drop trigger if exists update_ai_recommendation_outcomes_updated_at on public.ai_recommendation_outcomes;
create trigger update_ai_recommendation_outcomes_updated_at
  before update on public.ai_recommendation_outcomes
  for each row
  execute procedure public.update_updated_at_column();
