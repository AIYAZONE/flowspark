-- 多标签体系（goals / content_assets）
-- 设计：基于 Postgres text[] + GIN 索引，支持多选自由标签，
-- 用于「创作者维度视图」的检索与聚合。与 goals.category（单选主领域）互补。

-- 1) goals 增加 tags
alter table public.goals
  add column if not exists tags text[] not null default '{}';

-- 清理空字符串/去重/截断的写入约束
create or replace function public.normalize_tags(arr text[])
returns text[] language sql immutable as $$
  select coalesce(
    array_agg(distinct trim(x) order by trim(x)),
    array[]::text[]
  )
  from unnest(coalesce(arr, array[]::text[])) x
  where trim(x) <> ''
    and char_length(trim(x)) <= 40
$$;

create or replace function public.sanitize_goal_tags()
returns trigger language plpgsql as $$
begin
  new.tags := public.normalize_tags(new.tags);
  return new;
end;
$$;

drop trigger if exists trg_sanitize_goal_tags on public.goals;
create trigger trg_sanitize_goal_tags
  before insert or update on public.goals
  for each row execute function public.sanitize_goal_tags();

create index if not exists goals_tags_idx on public.goals using gin (tags);

-- 2) content_assets 增加 tags
alter table public.content_assets
  add column if not exists tags text[] not null default '{}';

create or replace function public.sanitize_asset_tags()
returns trigger language plpgsql as $$
begin
  new.tags := public.normalize_tags(new.tags);
  return new;
end;
$$;

drop trigger if exists trg_sanitize_asset_tags on public.content_assets;
create trigger trg_sanitize_asset_tags
  before insert or update on public.content_assets
  for each row execute function public.sanitize_asset_tags();

create index if not exists content_assets_tags_idx on public.content_assets using gin (tags);
