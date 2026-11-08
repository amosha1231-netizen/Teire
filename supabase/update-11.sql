-- עדכון 11: טופ 10 גם להיכל הנגינה (מצב שאלות ומצב נגינה).
-- Supabase -> SQL Editor -> New query -> מדביקים את כל הקובץ -> Run. אפשר להריץ יותר מפעם אחת.
alter table public.game_scores drop constraint if exists game_scores_game_check;
alter table public.game_scores add constraint game_scores_game_check check (game in ('swipe', 'race', 'duel', 'piano-q', 'piano-p'));
