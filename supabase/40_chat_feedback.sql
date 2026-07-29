-- 聊天答案反馈表：记录用户对每条助手回答的赞/踩与原因，用于闭环优化后续回答。
create table if not exists public.chat_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  turn_id text not null,
  rating text not null check (rating in ('up', 'down')),
  reason text check (reason is null or reason in ('too_verbose', 'not_relevant', 'inaccurate', 'want_specific')),
  excerpt text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 同一用户对同一回答只保留一行：支持 upsert（切换赞/踩、清空原因）而不产生重复行。
create unique index if not exists chat_feedback_user_turn_uniq
  on public.chat_feedback (user_id, turn_id);

-- 闭环聚合查询（近 N 天、按用户）走 (user_id, created_at)。
create index if not exists chat_feedback_user_created_idx
  on public.chat_feedback (user_id, created_at desc);

-- 更新 updated_at（触发器函数见迁移 18）。
drop trigger if exists set_chat_feedback_updated_at on public.chat_feedback;
create trigger set_chat_feedback_updated_at
  before update on public.chat_feedback
  for each row execute function public.update_updated_at_column();
