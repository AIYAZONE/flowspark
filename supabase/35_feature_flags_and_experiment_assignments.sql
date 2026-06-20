-- 35_feature_flags_and_experiment_assignments.sql

create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  rollout_percent integer not null default 50
    constraint feature_flags_rollout_percent_check
    check (rollout_percent >= 0 and rollout_percent <= 100),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.feature_flags is 'Server-side feature flags and experiment gates.';
comment on column public.feature_flags.rollout_percent is 'Optional rollout percentage for deterministic bucketing when no explicit assignment exists.';

create table if not exists public.experiment_assignments (
  id uuid primary key default gen_random_uuid(),
  experiment_key text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  variant text not null
    constraint experiment_assignments_variant_check
    check (variant in ('A', 'B')),
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experiment_assignments_experiment_user_key unique (experiment_key, user_id)
);

comment on table public.experiment_assignments is 'Stable per-user experiment assignments.';

create index if not exists idx_experiment_assignments_user_id
  on public.experiment_assignments(user_id);

create index if not exists idx_experiment_assignments_experiment_key
  on public.experiment_assignments(experiment_key);

alter table public.feature_flags enable row level security;
alter table public.experiment_assignments enable row level security;

drop policy if exists "feature_flags_read_authenticated" on public.feature_flags;
create policy "feature_flags_read_authenticated"
  on public.feature_flags
  for select
  to authenticated
  using (true);

drop policy if exists "experiment_assignments_select_own" on public.experiment_assignments;
create policy "experiment_assignments_select_own"
  on public.experiment_assignments
  for select
  using (auth.uid() = user_id);

drop policy if exists "experiment_assignments_insert_own" on public.experiment_assignments;
create policy "experiment_assignments_insert_own"
  on public.experiment_assignments
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "experiment_assignments_update_own" on public.experiment_assignments;
create policy "experiment_assignments_update_own"
  on public.experiment_assignments
  for update
  using (auth.uid() = user_id);

drop trigger if exists update_feature_flags_updated_at on public.feature_flags;
create trigger update_feature_flags_updated_at
  before update on public.feature_flags
  for each row
  execute procedure update_updated_at_column();

drop trigger if exists update_experiment_assignments_updated_at on public.experiment_assignments;
create trigger update_experiment_assignments_updated_at
  before update on public.experiment_assignments
  for each row
  execute procedure update_updated_at_column();
