-- 仅给 content_ideas 增加 source 字段（表与 policy 已由 53 建好，这里不重复建）。
-- 幂等：列已存在则跳过。

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'content_ideas'
      and column_name = 'source'
  ) then
    alter table public.content_ideas add column source text;
    create index if not exists content_ideas_source_idx
      on public.content_ideas(user_id, source);
  end if;
end $$;
