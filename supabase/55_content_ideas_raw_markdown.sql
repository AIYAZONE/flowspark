-- 为 content_ideas 增加 raw_markdown 列，完整保留 Trae Work 导出的 md 原文作为资产。
-- notes 字段仅存一句话摘要，用于卡片快速浏览。幂等：列已存在则跳过。

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'content_ideas'
      and column_name = 'raw_markdown'
  ) then
    alter table public.content_ideas add column raw_markdown text;
  end if;
end $$;
