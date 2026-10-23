-- עדכון 5: הסבר לתשובה בהצעות של משתמשים, ודיווחים על תשובה שנראית לא נכונה.
-- Supabase -> SQL Editor -> New query -> מדביקים את כל הקובץ -> Run. אפשר להריץ יותר מפעם אחת.

-- הסבר שמוצג אחרי שבוחרים תשובה (גם נכונה וגם שגויה)
alter table public.questions add column if not exists note text check (char_length(note) <= 300);

-- דיווחים. כל אחד יכול לדווח (בלי להתחבר), ורק מנהל רואה ומוחק.
create table if not exists public.reports (
  id bigint generated always as identity primary key,
  place text check (char_length(place) <= 60),
  question text not null check (char_length(question) <= 400),
  qkey text not null check (char_length(qkey) <= 500),
  reason text check (char_length(reason) <= 400),
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;
grant insert on public.reports to anon, authenticated;
grant select, delete on public.reports to authenticated;

drop policy if exists "anyone can report" on public.reports;
create policy "anyone can report" on public.reports
  for insert to anon, authenticated with check (true);

drop policy if exists "admins read reports" on public.reports;
create policy "admins read reports" on public.reports
  for select to authenticated using (public.is_admin());

drop policy if exists "admins delete reports" on public.reports;
create policy "admins delete reports" on public.reports
  for delete to authenticated using (public.is_admin());
