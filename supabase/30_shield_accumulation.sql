update public.user_streak_benefits
set available_shields = least(available_shields + 1, 3);

insert into public.user_streak_benefits (user_id, available_shields, last_shield_granted_for_streak)
select u.id, 1, null
from auth.users u
where not exists (
  select 1 from public.user_streak_benefits b where b.user_id = u.id
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, name, avatar_url, locale, timezone)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'locale', 'en'),
    'UTC'
  );

  insert into public.user_streak_benefits (user_id, available_shields)
  values (new.id, 1)
  on conflict (user_id) do update
  set available_shields = least(greatest(public.user_streak_benefits.available_shields, 1), 3);

  return new;
end;
$$ language plpgsql security definer;
