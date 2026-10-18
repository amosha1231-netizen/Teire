-- הריצו את הקובץ הזה פעם אחת ב-Supabase: SQL Editor -> New query -> הדביקו -> Run

create table if not exists public.questions (
  id bigint generated always as identity primary key,
  place text not null check (place in ('gan-eden', 'teiva', 'ohel', 'mitzrayim', 'sinai', 'midbar', 'beit-midrash', 'beit-knesset')),
  question text not null check (char_length(question) between 3 and 300),
  answers text[] not null check (array_length(answers, 1) = 4),
  correct smallint not null check (correct between 0 and 3),
  source text check (char_length(source) <= 100),
  author_name text check (char_length(author_name) <= 50),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- רשימת המנהלים: מי שהאימייל שלו כאן יכול לאשר שאלות
create table if not exists public.admins (
  email text primary key
);

alter table public.questions enable row level security;
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = auth.jwt() ->> 'email');
$$;

-- כולם רואים שאלות מאושרות; מנהלים רואים הכול
create policy "read approved or admin" on public.questions
  for select using (status = 'approved' or public.is_admin());

-- כל אחד יכול להציע שאלה, אבל רק במצב "ממתינה"
create policy "anyone can suggest" on public.questions
  for insert with check (status = 'pending');

-- רק מנהלים מאשרים, עורכים ומוחקים
create policy "admins update" on public.questions
  for update using (public.is_admin()) with check (public.is_admin());
create policy "admins delete" on public.questions
  for delete using (public.is_admin());

-- מנהל יכול לראות את השורה של עצמו (כדי שהאתר יזהה שהוא מנהל)
create policy "admin sees self" on public.admins
  for select using (email = auth.jwt() ->> 'email');
