-- 50_user_persona.sql
-- 个人记忆表（落实原则 A：用户在对话中每次对「个人」的补充都沉淀为长期个人记忆）
-- 区别于 system_memory_preferences（仅交互偏好），本表承载价值观/优势/经历/想成为的人等。

create table if not exists public.user_persona (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,        -- strength / value / experience / aspiration / aversion / context
  title text not null,           -- 简短标签，如 "擅长把复杂讲简单"
  detail text,                   -- 展开说明
  source text not null default 'chat',  -- chat / manual / inferred
  confidence text not null default 'medium', -- low / medium / high
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_persona_user_idx on public.user_persona(user_id);
create index if not exists user_persona_category_idx on public.user_persona(user_id, category);

alter table public.user_persona enable row level security;

create policy "Users can view own persona" on public.user_persona
  for select using (auth.uid() = user_id);

create policy "Users can insert own persona" on public.user_persona
  for insert with check (auth.uid() = user_id);

create policy "Users can update own persona" on public.user_persona
  for update using (auth.uid() = user_id);

create policy "Users can delete own persona" on public.user_persona
  for delete using (auth.uid() = user_id);
