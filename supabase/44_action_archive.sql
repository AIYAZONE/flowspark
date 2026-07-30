-- Phase 2: Action 归档（归档 ≠ 删除）
-- 给 actions 增加 archived 状态，让"放弃的 action"保留回顾价值而非被硬删，
-- 补齐 PARA 的 Archives 象限（goals / inbox 已有归档，actions 之前只有 completed + 硬删）。

alter table public.actions
  add column if not exists archived boolean not null default false,
  add column if not exists archived_at timestamptz;

comment on column public.actions.archived is 'true = 已归档（放弃但保留回顾），不出现在 /today、dashboard 活跃列表与 AI 上下文';
comment on column public.actions.archived_at is '归档时间';

create index if not exists idx_actions_archived on public.actions (archived);

-- 现有 RLS 策略已覆盖 UPDATE（按 owner_id / user_id 归属），归档作为 UPDATE 自动受保护，无需新增策略。
