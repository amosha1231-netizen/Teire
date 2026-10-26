-- עדכון 8: היכל עלמא (משחקים חיים לכל החדר). האורחים כותבים לכאן הצטרפות ותשובות, והמנחה קורא.
-- Supabase -> SQL Editor -> New query -> מדביקים את כל הקובץ -> Run. אפשר להריץ יותר מפעם אחת.
create table if not exists public.olama_events (
  id bigint generated always as identity primary key,
  room text not null check (room ~ '^[0-9]{4}$'),
  pid text not null check (char_length(pid) between 1 and 20),
  name text check (char_length(name) <= 16),
  kind text not null check (kind in ('join', 'ans')),
  q int check (q between 0 and 100),
  choice int check (choice between -1 and 3),
  ms int check (ms between 0 and 60000),
  created_at timestamptz not null default now()
);
create index if not exists olama_events_room_idx on public.olama_events (room, id);
alter table public.olama_events enable row level security;
revoke all on public.olama_events from anon, authenticated;
grant select, insert on public.olama_events to anon, authenticated;

drop policy if exists "everyone reads olama events" on public.olama_events;
create policy "everyone reads olama events" on public.olama_events
  for select to anon, authenticated using (created_at > now() - interval '1 day');

drop policy if exists "anyone adds an olama event" on public.olama_events;
create policy "anyone adds an olama event" on public.olama_events
  for insert to anon, authenticated with check (true);
