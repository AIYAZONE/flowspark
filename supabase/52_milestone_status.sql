-- 52_milestone_status.sql
-- 路径里程碑增加结构化阶段状态，从纯推断升级为可读写模型。
-- 解决 path-context 只能根据 action 数量猜测阶段的问题。

alter table public.path_milestones
  add column if not exists status text not null default 'pending' check (status in ('pending', 'active', 'completed'));

alter table public.path_milestones
  add column if not exists started_at timestamptz;

alter table public.path_milestones
  add column if not exists completed_at timestamptz;

-- 索引：按状态快速查当前活跃里程碑
create index if not exists path_milestones_status_idx on public.path_milestones(goal_id, status);
