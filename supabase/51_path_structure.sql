-- 51_path_structure.sql
-- 路径（goals）5 层结构：定位卡 + 策略支柱 + 里程碑 + 关键结果 + 行动
-- 落实原则 B 的载体：规划师生成的结构化成长系统，而非平铺 todo。

-- 1. goals 增加定位卡（JSONB，存 AI 生成的定位方案）
alter table public.goals add column if not exists positioning jsonb;

-- 2. 策略支柱（一条路径可有多个）
create table if not exists public.path_pillars (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null,
  rationale text,
  sort_order int not null default 0
);

-- 3. 里程碑 / 阶段
create table if not exists public.path_milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null,
  target_date date,
  sort_order int not null default 0
);

-- 4. 关键结果（KR，挂在里程碑下）
create table if not exists public.path_key_results (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.path_milestones(id) on delete cascade,
  title text not null,
  target text,          -- 量化目标，如 "发布 12 条视频"
  current text default '0'
);

-- 5. actions 增加外键，可挂到 milestone（向后兼容，可选）
alter table public.actions add column if not exists milestone_id uuid references public.path_milestones(id) on delete set null;

create index if not exists path_pillars_goal_idx on public.path_pillars(goal_id);
create index if not exists path_milestones_goal_idx on public.path_milestones(goal_id);
create index if not exists path_kr_milestone_idx on public.path_key_results(milestone_id);

-- RLS：子表归属通过关联 goal 的 user_id / owner_id 判定
alter table public.path_pillars enable row level security;
alter table public.path_milestones enable row level security;
alter table public.path_key_results enable row level security;

create policy "Users can view own pillars" on public.path_pillars
  for select using (
    exists (select 1 from public.goals g where g.id = goal_id and (auth.uid() = g.user_id or auth.uid() = g.owner_id))
  );
create policy "Users can modify own pillars" on public.path_pillars
  for all using (
    exists (select 1 from public.goals g where g.id = goal_id and (auth.uid() = g.user_id or auth.uid() = g.owner_id))
  ) with check (
    exists (select 1 from public.goals g where g.id = goal_id and (auth.uid() = g.user_id or auth.uid() = g.owner_id))
  );

create policy "Users can view own milestones" on public.path_milestones
  for select using (
    exists (select 1 from public.goals g where g.id = goal_id and (auth.uid() = g.user_id or auth.uid() = g.owner_id))
  );
create policy "Users can modify own milestones" on public.path_milestones
  for all using (
    exists (select 1 from public.goals g where g.id = goal_id and (auth.uid() = g.user_id or auth.uid() = g.owner_id))
  ) with check (
    exists (select 1 from public.goals g where g.id = goal_id and (auth.uid() = g.user_id or auth.uid() = g.owner_id))
  );

create policy "Users can view own key_results" on public.path_key_results
  for select using (
    exists (
      select 1 from public.path_milestones m
      join public.goals g on g.id = m.goal_id
      where m.id = milestone_id and (auth.uid() = g.user_id or auth.uid() = g.owner_id)
    )
  );
create policy "Users can modify own key_results" on public.path_key_results
  for all using (
    exists (
      select 1 from public.path_milestones m
      join public.goals g on g.id = m.goal_id
      where m.id = milestone_id and (auth.uid() = g.user_id or auth.uid() = g.owner_id)
    )
  ) with check (
    exists (
      select 1 from public.path_milestones m
      join public.goals g on g.id = m.goal_id
      where m.id = milestone_id and (auth.uid() = g.user_id or auth.uid() = g.owner_id)
    )
  );
