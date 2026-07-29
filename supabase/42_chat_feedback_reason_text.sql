-- 点踩自定义原因：自由文本，与预设 reason 枚举互斥（reason 为预设值时 reason_text 留空）。
alter table public.chat_feedback add column if not exists reason_text text;

comment on column public.chat_feedback.reason_text is
  '点踩时的自定义原因（自由文本）。与预设 reason 互斥：选了预设原因时此列留空，仅自由输入时才有值。';
