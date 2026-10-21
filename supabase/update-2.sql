-- עדכון 2: שלבי קושי לשאלות, הצעת שאלות לכל התחנות, וטבלת אלופים.
-- Supabase -> SQL Editor -> New query -> מדביקים את כל הקובץ -> Run. אפשר להריץ יותר מפעם אחת.

-- שלב (1 קל, 2 בינוני, 3 קשה) לכל שאלה
alter table public.questions add column if not exists level smallint not null default 1;
alter table public.questions drop constraint if exists questions_level_check;
alter table public.questions add constraint questions_level_check check (level between 1 and 3);

-- אפשר להציע שאלות גם למשנה, לגמרא, לבית המקדש ולדוד המלך
alter table public.questions drop constraint if exists questions_place_check;
alter table public.questions add constraint questions_place_check check (place in (
  'gan-eden', 'teiva', 'ohel', 'mitzrayim', 'sinai', 'midbar', 'beit-midrash', 'beit-knesset',
  'mishna', 'gemara', 'mikdash', 'david'));

-- טבלת האלופים. מצטרפים רק מי שבחר בכך באתר, ונשמרים רק שם, כוכבים ונשמות.
create table if not exists public.players (
  id text primary key check (char_length(id) between 16 and 40),
  name text not null check (char_length(name) between 1 and 20),
  stars int not null default 0 check (stars between 0 and 500),
  souls int not null default 0 check (souls between 0 and 50),
  updated_at timestamptz not null default now()
);
alter table public.players enable row level security;
revoke all on public.players from anon, authenticated;
grant select, delete on public.players to authenticated;

-- רק מנהל רואה ומוחק שורות ישירות (למשל שם לא מתאים)
drop policy if exists "admins manage players" on public.players;
create policy "admins manage players" on public.players
  for all using (public.is_admin()) with check (public.is_admin());

-- כולם רואים את הטבלה, בלי המזהים הסודיים
create or replace function public.get_leaderboard() returns table (name text, stars int, souls int)
language sql stable security definer set search_path = public as $$
  select name, stars, souls from public.players order by stars desc, souls desc, updated_at limit 30;
$$;

-- עדכון הניקוד של שחקן לפי המזהה הסודי שלו (נשמר רק בדפדפן שלו)
create or replace function public.submit_score(p_id text, p_name text, p_stars int, p_souls int) returns void
language sql security definer set search_path = public as $$
  insert into public.players (id, name, stars, souls, updated_at)
  values (p_id, left(btrim(p_name), 20), least(greatest(p_stars, 0), 500), least(greatest(p_souls, 0), 50), now())
  on conflict (id) do update set name = excluded.name, stars = excluded.stars, souls = excluded.souls, updated_at = now();
$$;

create or replace function public.leave_board(p_id text) returns void
language sql security definer set search_path = public as $$
  delete from public.players where id = p_id;
$$;

revoke all on function public.get_leaderboard() from public;
revoke all on function public.submit_score(text, text, int, int) from public;
revoke all on function public.leave_board(text) from public;
grant execute on function public.get_leaderboard() to anon, authenticated;
grant execute on function public.submit_score(text, text, int, int) to anon, authenticated;
grant execute on function public.leave_board(text) to anon, authenticated;
