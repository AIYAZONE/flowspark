-- Phase 3: Action↔Action 链接（Zettelkasten 骨架）
-- 让 action 之间建立可选的"关联 / 前置"关系，
-- 支撑 AI 涌现回顾与网状知识，而非被动地逐条硬删。

create table if not exists public.action_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_action_id uuid not null references public.actions (id) on delete cascade,
  target_action_id uuid not null references public.actions (id) on delete cascade,
  link_type text not null default 'related' check (link_type in ('related', 'precedes')),
  note text,
  created_at timestamptz not null default now(),
  unique (source_action_id, target_action_id, link_type),
  check (source_action_id <> target_action_id)
);

comment on table public.action_links is 'Action 间的可选关系（关联/前置），支撑 Zettelkasten 式网状链接';
comment on column public.action_links.link_type is 'related = 关联；precedes = 本行动先于目标行动';

create index if not exists idx_action_links_source on public.action_links (source_action_id);
create index if not exists idx_action_links_target on public.action_links (target_action_id);
create index if not exists idx_action_links_user on public.action_links (user_id);

-- RLS：链接归属其创建者，且创建前已校验两端 action 均归属当前用户
alter table public.action_links enable row level security;

drop policy if exists "action_links_select_own" on public.action_links;
create policy "action_links_select_own" on public.action_links
  for select using (auth.uid() = user_id);

drop policy if exists "action_links_insert_own" on public.action_links;
create policy "action_links_insert_own" on public.action_links
  for insert with check (auth.uid() = user_id);

drop policy if exists "action_links_update_own" on public.action_links;
create policy "action_links_update_own" on public.action_links
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "action_links_delete_own" on public.action_links;
create policy "action_links_delete_own" on public.action_links
  for delete using (auth.uid() = user_id);
