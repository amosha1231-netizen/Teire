-- עדכון 4: חשבונות שחקנים. כל שחקן נרשם עם שם משתמש וסיסמה, וההתקדמות שלו (מטבעות, כוכבים, נשמות, דמות) נשמרת בשרת.
-- Supabase -> SQL Editor -> New query -> מדביקים את כל הקובץ -> Run. אפשר להריץ יותר מפעם אחת.
-- שם המשתמש נשמר כ-Auth user (ב-Supabase Auth), כך ששם תפוס לא יכול להירשם פעמיים.
-- חשוב: ב-Authentication -> Providers -> Email לכבות את "Confirm email", אחרת ההרשמה לא מתחברת מיד.

-- שורה אחת לכל שחקן. המשתמש רואה ומעדכן רק את השורה שלו.
create table if not exists public.progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb check (octet_length(data::text) <= 100000),
  updated_at timestamptz not null default now()
);
alter table public.progress enable row level security;
revoke all on public.progress from anon, authenticated;
grant select, insert, update on public.progress to authenticated;

drop policy if exists "own progress read" on public.progress;
create policy "own progress read" on public.progress
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own progress insert" on public.progress;
create policy "own progress insert" on public.progress
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "own progress update" on public.progress;
create policy "own progress update" on public.progress
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
