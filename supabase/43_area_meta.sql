-- Area (领域) 呈现元信息层
-- 设计说明：goal 的"领域"已由 goals.category 文本字段承担（含内置 8 类 + 自定义）。
-- 本表不新增归一化的 areas 实体，仅在 category 之上叠加用户级呈现元信息
-- （排序 / 图标 / 描述），目标表结构零改动，chat/AI/分享链路无感。
-- 键为 category 字符串，与 goals.category 一一对应。

create table if not exists public.area_meta (
    id uuid default gen_random_uuid() not null,
    user_id uuid not null references auth.users (id) on delete cascade,
    category_key text not null,
    sort_order integer default 0,
    icon text default 'circle',
    description text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    primary key (id),
    unique (user_id, category_key)
);

create index if not exists area_meta_user_id_idx on public.area_meta (user_id);

comment on table public.area_meta is '用户级领域（category）呈现元信息：排序/图标/描述';
comment on column public.area_meta.category_key is '对应 goals.category 的取值';

-- RLS：照抄现有 auth.uid() = user_id 模式（单 ownership 列）
alter table public.area_meta enable row level security;

create policy "Users can view own area_meta" on public.area_meta
    for select using (auth.uid() = user_id);

create policy "Users can insert own area_meta" on public.area_meta
    for insert with check (auth.uid() = user_id);

create policy "Users can update own area_meta" on public.area_meta
    for update using (auth.uid() = user_id);

create policy "Users can delete own area_meta" on public.area_meta
    for delete using (auth.uid() = user_id);
