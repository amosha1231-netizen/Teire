-- עדכון 9: איזה טלפון יש לכל שחקן (אנדרואיד / אייפון / מחשב), ומי מוכן לעזור לבדוק את אפליקציית האנדרואיד.
-- Supabase -> SQL Editor -> New query -> מדביקים את כל הקובץ -> Run. אפשר להריץ יותר מפעם אחת.
-- נשמרים רק: השם שהשחקן בחר, סוג הטלפון, והאם הוא מוכן לבדוק. רק מנהל רואה את הרשימה (בלשונית "ניהול").
create table if not exists public.player_devices (
  id text primary key check (id ~ '^[0-9a-f]{32}$'),
  name text not null check (char_length(name) between 1 and 20),
  device text not null check (device in ('android', 'iphone', 'computer')),
  tester boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.player_devices enable row level security;
revoke all on public.player_devices from anon, authenticated;
grant select on public.player_devices to authenticated;

drop policy if exists "admins read devices" on public.player_devices;
create policy "admins read devices" on public.player_devices
  for select to authenticated using (public.is_admin());

-- השחקן כותב רק דרך הפונקציה, עם המזהה הסודי שנשמר אצלו בדפדפן
create or replace function public.set_device(p_id text, p_name text, p_device text, p_tester boolean)
returns void language sql security definer set search_path = public as $$
  insert into public.player_devices (id, name, device, tester, updated_at)
  values (p_id, left(trim(p_name), 20), p_device, coalesce(p_tester, false) and p_device = 'android', now())
  on conflict (id) do update set name = excluded.name, device = excluded.device, tester = excluded.tester, updated_at = now();
$$;
revoke all on function public.set_device(text, text, text, boolean) from public;
grant execute on function public.set_device(text, text, text, boolean) to anon, authenticated;
