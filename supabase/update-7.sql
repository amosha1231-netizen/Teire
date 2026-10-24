-- עדכון 7: טופ 10 לכל משחק (אתגר המקורות, מרוץ המקורות, דו-קרב). השמות והציונים גלויים לכולם.
-- Supabase -> SQL Editor -> New query -> מדביקים את כל הקובץ -> Run. אפשר להריץ יותר מפעם אחת.
create table if not exists public.game_scores (
  id bigint generated always as identity primary key,
  game text not null check (game in ('swipe', 'race', 'duel')),
  name text not null check (char_length(name) between 1 and 20),
  score int not null check (score between 0 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists game_scores_top_idx on public.game_scores (game, score desc, created_at);
alter table public.game_scores enable row level security;
revoke all on public.game_scores from anon, authenticated;
grant select, insert on public.game_scores to anon, authenticated;

drop policy if exists "everyone reads game scores" on public.game_scores;
create policy "everyone reads game scores" on public.game_scores
  for select to anon, authenticated using (true);

drop policy if exists "anyone adds a game score" on public.game_scores;
create policy "anyone adds a game score" on public.game_scores
  for insert to anon, authenticated with check (true);
