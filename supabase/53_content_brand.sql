-- 个人品牌专项（Later）：选题库 + 内容日历 数据骨架
-- 本期（人设一致性检查）已完成，以下两张表为「视频号选题库 / 内容日历」预留，留待下一期实现。
-- 设计要点：
--  - content_ideas：选题库（用户或 AI 生成的选题草稿，可关联人设一致性检查）
--  - content_calendar：内容日历（已排期的发布计划）
--  - 均带 user_id + RLS，遵循项目既有 ownership 模式。

create table if not exists public.content_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  angle text,
  hook text,
  notes text,
  status text not null default 'idea' check (status in ('idea','approved','produced','published','archived')),
  persona_check_score int check (persona_check_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_ideas_user_idx on public.content_ideas(user_id, updated_at desc);

create table if not exists public.content_calendar (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idea_id uuid references public.content_ideas(id) on delete set null,
  planned_date date not null,
  platform text not null default 'weixin_channels',
  status text not null default 'planned' check (status in ('planned','published','skipped')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_calendar_user_idx on public.content_calendar(user_id, planned_date);

alter table public.content_ideas enable row level security;
alter table public.content_calendar enable row level security;

create policy "content_ideas owner" on public.content_ideas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "content_calendar owner" on public.content_calendar
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
