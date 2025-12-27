# Supabase 初始化与安全策略

## 文件说明
- 行级安全策略：请执行 [rls_policies.sql](file:///Users/brucewang/Documents/AIYA/goals/supabase/rls_policies.sql)
- 存储初始化：请执行 [storage_setup.sql](file:///Users/brucewang/Documents/AIYA/goals/supabase/storage_setup.sql)

## 前置要求
- 已创建以下表并包含用户字段
  - public.user_profiles(id uuid 主键 = auth.user.id, name, avatar_url, locale, timezone)
  - public.goals(user_id uuid, ...)
  - public.actions(user_id uuid, goal_id uuid, ...)
  - public.daily_scores(user_id uuid, score_date date, score int)
- 环境变量已在项目配置
  - NEXT_PUBLIC_SUPABASE_URL、NEXT_PUBLIC_SUPABASE_ANON_KEY、NEXT_PUBLIC_SITE_URL

## 执行步骤
- 打开 Supabase 控制台 → SQL Editor
- 先执行 rls_policies.sql，开启 RLS 并添加各表策略
- 再执行 storage_setup.sql，创建 avatars 桶并设置访问策略

## 验证方法
- 应用侧验证
  - 仅能看到当前登录用户的 goals/actions/daily_scores
  - 上传头像后生成 public URL，并在 /profile 可看到地址更新
- 控制台简单检查
  - SELECT 语句可执行，但在控制台环境下 auth.uid() 通常为 null；以应用端行为为准

## 常见问题与处理
- 重复策略报错（policy already exists）
  - 先删除旧策略再重新执行，例如：
    - DROP POLICY IF EXISTS user_profiles_select ON public.user_profiles;
    - DROP POLICY IF EXISTS goals_select ON public.goals;
    - 依此类推删除 insert/update/delete 的策略
- 桶已存在或需修改公开属性
  - 将桶设为公开：SELECT storage.update_bucket('avatars', public := true);
  - 删除已存在桶（谨慎）：SELECT storage.delete_bucket('avatars');
- 存储对象策略匹配失败
  - 确认 storage_setup.sql 已执行成功，且策略的 bucket_id = 'avatars'
  - 头像上传路径建议格式：userId/timestamp.ext，避免覆盖

## 回滚指南
- 关闭某表 RLS（临时）：
  - ALTER TABLE public.goals DISABLE ROW LEVEL SECURITY;
  - 其它表类同
- 删除策略：
  - 逐条 DROP POLICY ... ON public.table_name
- 移除存储策略或桶：
  - 删除策略：在 SQL Editor 中 DROP POLICY '策略名称' ON storage.objects
  - 删除桶：SELECT storage.delete_bucket('avatars');
  - 注意：删除桶会移除其中的文件，请谨慎操作

## 关联代码
- 头像上传组件：[AvatarUploader.tsx](file:///Users/brucewang/Documents/AIYA/goals/src/components/AvatarUploader.tsx)
- 资料更新动作：[actions.ts](file:///Users/brucewang/Documents/AIYA/goals/src/app/(authenticated)/profile/actions.ts)
- 中间件与邮箱验证：[middleware.ts](file:///Users/brucewang/Documents/AIYA/goals/src/lib/supabase/middleware.ts)
