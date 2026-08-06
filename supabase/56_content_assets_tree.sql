-- 通用内容资产树（AI 自动生成 / 归类，用户零操作）
--
-- 设计目标：让 Agent 在聊天中自主决定"沉淀什么类型的资产、挂到哪条路径下"，
-- 目录树（content_folders）由 AI 动态创建，用户不需要手动建目录 / 拖拽 / 归类。
-- 一条资产（content_assets）可挂在任意层级的 folder 下，实现"多路径都能挂内容资产"。
--
-- 兼容：保留既有 content_ideas（angle 由导入时映射），通过视图 content_ideas_view
-- 把旧表映射进新树，后续 brand-studio 统一读 content_assets。

-- 1) 文件夹树（自引用）
create table if not exists public.content_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.content_folders(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  -- 物化路径，便于按前缀查询子树，形如 /<id>/<id>/<id>
  path text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, parent_id, name)
);

create index if not exists content_folders_user_idx on public.content_folders(user_id, parent_id);
create index if not exists content_folders_path_idx on public.content_folders(path);

-- 2) 通用内容资产（多类型，挂在任意 folder 下）
create table if not exists public.content_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references public.content_folders(id) on delete set null,
  -- 资产类型：idea/script/note/data/strategy/tool 等，由 AI 判断
  kind text not null default 'idea'
    check (kind in ('idea','script','note','data','strategy','tool','other')),
  title text not null,
  -- 一句话摘要（卡片快速浏览）
  summary text,
  -- 完整 Markdown 正文（资产本体）
  body_markdown text,
  status text not null default 'captured'
    check (status in ('captured','refined','approved','produced','published','archived')),
  -- 来源：chat / import / manual
  source text not null default 'chat',
  -- 触发该资产沉淀的会话来源（便于追溯）
  chat_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_assets_user_idx on public.content_assets(user_id, updated_at desc);
create index if not exists content_assets_folder_idx on public.content_assets(folder_id);
create index if not exists content_assets_kind_idx on public.content_assets(user_id, kind);

-- 3) RLS（沿用项目 ownership 模式）
alter table public.content_folders enable row level security;
alter table public.content_assets enable row level security;

create policy "content_folders owner" on public.content_folders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "content_assets owner" on public.content_assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4) 兼容视图：把旧 content_ideas 映射进新资产树（folder 由 angle 推断，先留 null）
--    方便 brand-studio 平滑迁移，后续可废弃 content_ideas。
create or replace view public.content_ideas_view as
select
  i.id,
  i.user_id,
  i.title,
  i.angle,
  i.hook,
  i.notes,
  i.status,
  i.persona_check_score,
  i.source,
  i.raw_markdown,
  i.created_at,
  i.updated_at
from public.content_ideas i;
