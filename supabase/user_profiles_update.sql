-- Ensure user_profiles has required columns and backfill from auth.users metadata

-- 1) Add columns if not exists
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS timezone text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS locale text;

-- 2) Create missing rows based on existing auth.users (id match)
INSERT INTO public.user_profiles (id, name, avatar_url, locale, timezone)
SELECT au.id,
       au.raw_user_meta_data->>'name',
       au.raw_user_meta_data->>'avatar_url',
       COALESCE(au.raw_user_meta_data->>'locale', 'en'),
       'UTC'
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = au.id);

-- 3) Backfill null fields from auth.users metadata
UPDATE public.user_profiles up
SET name = COALESCE(up.name, au.raw_user_meta_data->>'name'),
    avatar_url = COALESCE(up.avatar_url, au.raw_user_meta_data->>'avatar_url'),
    locale = COALESCE(up.locale, au.raw_user_meta_data->>'locale'),
    timezone = COALESCE(up.timezone, 'UTC')
FROM auth.users au
WHERE up.id = au.id;

-- 4) Set defaults for future inserts (optional)
ALTER TABLE public.user_profiles ALTER COLUMN locale SET DEFAULT 'en';
ALTER TABLE public.user_profiles ALTER COLUMN timezone SET DEFAULT 'UTC';
