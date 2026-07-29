-- chat_feedback 行级安全：仅本人可读、写、改自己的反馈。
alter table public.chat_feedback enable row level security;

drop policy if exists chat_feedback_select_own on public.chat_feedback;
create policy chat_feedback_select_own on public.chat_feedback
  for select using (auth.uid() = user_id);

drop policy if exists chat_feedback_insert_own on public.chat_feedback;
create policy chat_feedback_insert_own on public.chat_feedback
  for insert with check (auth.uid() = user_id);

drop policy if exists chat_feedback_update_own on public.chat_feedback;
create policy chat_feedback_update_own on public.chat_feedback
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
