-- 02_storage_setup.sql
-- 配置 Supabase Storage 存储桶及权限

-- 1. 创建 avatars 存储桶 (如果不存在)
INSERT INTO storage.buckets (id, name, public)
SELECT 'avatars', 'avatars', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'avatars'
);

-- 确保 bucket 是 public 的
UPDATE storage.buckets SET public = true WHERE id = 'avatars';

-- 2. 清理旧策略 (防止重复)
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Owner update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete avatars" ON storage.objects;

-- 3. 配置存储策略

-- 允许任何人读取公开头像
CREATE POLICY "Public read avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 允许认证用户上传头像
CREATE POLICY "Authenticated upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());

-- 允许用户更新自己的头像
CREATE POLICY "Owner update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid())
WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());

-- 允许用户删除自己的头像
CREATE POLICY "Owner delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid());
