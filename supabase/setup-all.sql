-- התקנה בפעם אחת: Supabase -> SQL Editor -> New query -> מדביקים את כל הקובץ -> Run
-- יוצר את הטבלאות וההרשאות, ומוסיף את השאלות לדוגמה (רק אם הטבלה ריקה).

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

grant select, insert on public.questions to anon, authenticated;
grant update, delete on public.questions to authenticated;
grant select on public.admins to authenticated;

drop policy if exists "read approved or admin" on public.questions;
drop policy if exists "anyone can suggest" on public.questions;
drop policy if exists "admins update" on public.questions;
drop policy if exists "admins delete" on public.questions;
drop policy if exists "admin sees self" on public.admins;

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


-- שאלות לדוגמה
do $$ begin
if not exists (select 1 from public.questions) then
insert into public.questions (place, question, answers, correct, source, author_name, status) values
  ('gan-eden', 'מה נברא ביום הראשון?', array['האור', 'הים', 'האדם', 'העצים'], 0, 'בראשית א, ג-ה', 'צוות האתר', 'approved'),
  ('gan-eden', 'באיזה יום נבראו השמש, הירח והכוכבים?', array['ביום השני', 'ביום השלישי', 'ביום הרביעי', 'ביום השישי'], 2, 'בראשית א, יד-יט', 'צוות האתר', 'approved'),
  ('gan-eden', 'באיזה יום נברא האדם?', array['ביום הראשון', 'ביום הרביעי', 'ביום החמישי', 'ביום השישי'], 3, 'בראשית א, כו-לא', 'צוות האתר', 'approved'),
  ('gan-eden', 'אילו שני עצים מיוחדים היו בתוך הגן?', array['עץ התאנה ועץ הזית', 'עץ החיים ועץ הדעת טוב ורע', 'עץ התמר ועץ הרימון', 'עץ החכמה ועץ השמחה'], 1, 'בראשית ב, ט', 'צוות האתר', 'approved'),
  ('gan-eden', 'מי פיתה את חוה לאכול מעץ הדעת?', array['הנחש', 'השועל', 'העורב', 'האריה'], 0, 'בראשית ג', 'צוות האתר', 'approved'),
  ('gan-eden', 'מה שמו של הבן השלישי של אדם וחוה שמוזכר בתורה?', array['חנוך', 'שת', 'נח', 'למך'], 1, 'בראשית ד, כה', 'צוות האתר', 'approved'),
  ('teiva', 'כמה ימים ירד גשם המבול?', array['שבעה ימים', 'ארבעים יום וארבעים לילה', 'מאה וחמישים יום', 'שנה שלמה'], 1, 'בראשית ז, יב', 'צוות האתר', 'approved'),
  ('teiva', 'על איזה הר נחה התיבה?', array['הר סיני', 'הרי אררט', 'הר המוריה', 'הר נבו'], 1, 'בראשית ח, ד', 'צוות האתר', 'approved'),
  ('teiva', 'מה היו שמות בניו של נח?', array['שם, חם ויפת', 'קין, הבל ושת', 'אברהם, נחור והרן', 'ראובן, שמעון ולוי'], 0, 'בראשית ו, י', 'צוות האתר', 'approved'),
  ('teiva', 'איזו ציפור שלח נח ראשונה מן התיבה?', array['יונה', 'עורב', 'נשר', 'דרור'], 1, 'בראשית ח, ז', 'צוות האתר', 'approved'),
  ('teiva', 'מה הביאה היונה בפיה?', array['ענף של תאנה', 'עלה זית', 'שיבולת חיטה', 'פרח'], 1, 'בראשית ח, יא', 'צוות האתר', 'approved'),
  ('teiva', 'מה האות שנתן ה'' שלא יהיה עוד מבול?', array['כוכב', 'הקשת בענן', 'ברק', 'שלג'], 1, 'בראשית ט, יג', 'צוות האתר', 'approved'),
  ('ohel', 'מה היה שמו של אברהם לפני שה'' הוסיף לו אות?', array['אברם', 'אבירם', 'אבנר', 'אביה'], 0, 'בראשית יז, ה', 'צוות האתר', 'approved'),
  ('ohel', 'כמה אנשים (מלאכים) באו לאוהל של אברהם?', array['אחד', 'שניים', 'שלושה', 'ארבעה'], 2, 'בראשית יח, ב', 'צוות האתר', 'approved'),
  ('ohel', 'מי היה בן אחיו של אברהם שהלך איתו לארץ כנען?', array['לבן', 'לוט', 'אליעזר', 'ישמעאל'], 1, 'בראשית יב, ה', 'צוות האתר', 'approved'),
  ('ohel', 'בן כמה היה אברהם כשנולד יצחק?', array['שבעים וחמש', 'תשעים', 'תשעים ותשע', 'מאה'], 3, 'בראשית כא, ה', 'צוות האתר', 'approved'),
  ('ohel', 'באיזו מערה קנה אברהם מקום קבורה לשרה?', array['מערת המכפלה', 'מערת אליהו', 'מערת עדולם', 'מערת לוט'], 0, 'בראשית כג', 'צוות האתר', 'approved'),
  ('ohel', 'מי היה בנו הבכור של יעקב אבינו?', array['יהודה', 'יוסף', 'ראובן', 'שמעון'], 2, 'בראשית מט, ג', 'צוות האתר', 'approved'),
  ('mitzrayim', 'מי חלם על שבע פרות שמנות ושבע פרות רזות?', array['יוסף', 'שר המשקים', 'פרעה', 'יעקב'], 2, 'בראשית מא', 'צוות האתר', 'approved'),
  ('mitzrayim', 'מה שמה של אמו של משה רבנו?', array['מרים', 'צפורה', 'יוכבד', 'אלישבע'], 2, 'שמות ו, כ', 'צוות האתר', 'approved'),
  ('mitzrayim', 'מי מצאה את התיבה של משה ביאור?', array['מרים', 'בת פרעה', 'יוכבד', 'שפרה'], 1, 'שמות ב, ה', 'צוות האתר', 'approved'),
  ('mitzrayim', 'מה הייתה המכה הראשונה במצרים?', array['צפרדע', 'דם', 'ערוב', 'חושך'], 1, 'שמות ז, כ', 'צוות האתר', 'approved'),
  ('mitzrayim', 'מה הייתה המכה האחרונה במצרים?', array['ארבה', 'ברד', 'חושך', 'מכת בכורות'], 3, 'שמות יב, כט', 'צוות האתר', 'approved'),
  ('mitzrayim', 'כמה מכות הביא ה'' על המצרים במצרים?', array['שבע', 'עשר', 'שתים עשרה', 'ארבעים'], 1, null, 'צוות האתר', 'approved'),
  ('sinai', 'באיזו פרשה מסופר על מתן עשרת הדברות בפעם הראשונה?', array['משפטים', 'בשלח', 'יתרו', 'ואתחנן'], 2, 'שמות כ', 'צוות האתר', 'approved'),
  ('sinai', 'באיזה חודש ניתנה התורה?', array['ניסן', 'אייר', 'סיון', 'תשרי'], 2, 'שמות יט, א', 'צוות האתר', 'approved'),
  ('sinai', 'כמה לוחות הוריד משה מההר?', array['אחד', 'שניים', 'שלושה', 'עשרה'], 1, 'שמות לב, טו', 'צוות האתר', 'approved'),
  ('sinai', 'כמה ימים היה משה בהר?', array['שבעה', 'שלושים', 'ארבעים', 'מאה'], 2, 'שמות כד, יח', 'צוות האתר', 'approved'),
  ('sinai', 'מה עשו בני ישראל כשחשבו שמשה מתעכב?', array['בנו מגדל', 'עשו עגל זהב', 'חזרו למצרים', 'יצאו למלחמה'], 1, 'שמות לב', 'צוות האתר', 'approved'),
  ('sinai', 'מה ענה משה כשה'' קרא לו מתוך הסנה?', array['הנני', 'מי אנוכי', 'שלח נא ביד תשלח', 'אמן'], 0, 'שמות ג, ד', 'צוות האתר', 'approved'),
  ('midbar', 'מה אכלו בני ישראל במדבר?', array['מן', 'תמרים', 'לחם מצרים', 'דגים'], 0, 'שמות טז', 'צוות האתר', 'approved'),
  ('midbar', 'כמה שנים הלכו בני ישראל במדבר?', array['שבע', 'עשרים', 'ארבעים', 'שבעים'], 2, 'במדבר יד, לג', 'צוות האתר', 'approved'),
  ('midbar', 'כמה מרגלים שלח משה לתור את הארץ?', array['שניים', 'שבעה', 'עשרה', 'שנים עשר'], 3, 'במדבר יג', 'צוות האתר', 'approved'),
  ('midbar', 'אילו מרגלים אמרו דברים טובים על ארץ ישראל?', array['יהושע וכלב', 'אהרן וחור', 'נדב ואביהוא', 'דתן ואבירם'], 0, 'במדבר יד, ו-ז', 'צוות האתר', 'approved'),
  ('midbar', 'מי היה האומן הראשי שבנה את המשכן?', array['אהרן', 'בצלאל', 'יהושע', 'פנחס'], 1, 'שמות לא, ב', 'צוות האתר', 'approved'),
  ('midbar', 'באיזה חומש נמצאת פרשת בלק?', array['שמות', 'ויקרא', 'במדבר', 'דברים'], 2, 'במדבר כב', 'צוות האתר', 'approved'),
  ('beit-midrash', 'מהי המסכת הראשונה בש"ס?', array['שבת', 'ברכות', 'בבא קמא', 'פאה'], 1, null, 'צוות האתר', 'approved'),
  ('beit-midrash', 'כמה סדרים יש במשנה?', array['ארבעה', 'חמישה', 'שישה', 'שבעה'], 2, null, 'צוות האתר', 'approved'),
  ('beit-midrash', 'באילו מילים פותחת המשנה הראשונה במסכת ברכות?', array['מאימתי קורין את שמע בערבין', 'משה קיבל תורה מסיני', 'ארבעה אבות נזיקין', 'שנים אוחזין בטלית'], 0, 'ברכות ב, א', 'צוות האתר', 'approved'),
  ('beit-midrash', 'מי ערך וחתם את המשנה?', array['רבי עקיבא', 'רב אשי', 'רבי יהודה הנשיא', 'הלל הזקן'], 2, null, 'צוות האתר', 'approved'),
  ('beit-midrash', 'איזה פירוש מודפס בצד הפנימי של דף הגמרא?', array['תוספות', 'רש"י', 'רמב"ם', 'מהרש"א'], 1, null, 'צוות האתר', 'approved'),
  ('beit-midrash', 'המשנה "שנים אוחזין בטלית" פותחת איזו מסכת?', array['בבא קמא', 'בבא מציעא', 'בבא בתרא', 'סנהדרין'], 1, 'בבא מציעא ב, א', 'צוות האתר', 'approved'),
  ('beit-midrash', 'לפי בית שמאי, כמה נרות חנוכה מדליקים בלילה הראשון?', array['אחד', 'שניים', 'שבעה', 'שמונה'], 3, 'שבת כא, ב', 'צוות האתר', 'approved'),
  ('beit-midrash', 'איזו מסכת עוסקת בעיקר בדיני יום הכיפורים?', array['יומא', 'סוכה', 'ראש השנה', 'תענית'], 0, null, 'צוות האתר', 'approved'),
  ('beit-midrash', 'השלימו את הכלל: "המוציא מחבירו..."', array['ישלם כפליים', 'עליו הראיה', 'פטור', 'חולקין'], 1, 'בבא קמא מו, ב', 'צוות האתר', 'approved'),
  ('beit-midrash', 'לפי שמעון הצדיק, על שלושה דברים העולם עומד. מהם?', array['על הדין, על האמת ועל השלום', 'על התורה, על העבודה ועל גמילות חסדים', 'על התורה, על התפילה ועל הצדקה', 'על האמונה, על התורה ועל המצוות'], 1, 'אבות א, ב', 'צוות האתר', 'approved'),
  ('beit-midrash', 'הלל אומר: הוי מתלמידיו של...', array['משה', 'אהרן', 'שמואל', 'אליהו'], 1, 'אבות א, יב', 'צוות האתר', 'approved'),
  ('beit-knesset', 'איזו ברכה מברכים לפני אכילת לחם?', array['בורא פרי האדמה', 'בורא מיני מזונות', 'המוציא לחם מן הארץ', 'שהכל נהיה בדברו'], 2, null, 'צוות האתר', 'approved'),
  ('beit-knesset', 'כמה ברכות יש היום בתפילת שמונה עשרה?', array['שמונה עשרה', 'תשע עשרה', 'שבע', 'עשרים'], 1, null, 'צוות האתר', 'approved'),
  ('beit-knesset', 'איזו ברכה מברכים על תפוח עץ?', array['בורא פרי העץ', 'בורא פרי האדמה', 'שהכל נהיה בדברו', 'בורא מיני מזונות'], 0, null, 'צוות האתר', 'approved'),
  ('beit-knesset', 'איזו ברכה מברכים לפני שתיית מים?', array['בורא פרי הגפן', 'שהכל נהיה בדברו', 'בורא פרי האדמה', 'אין צריך ברכה'], 1, null, 'צוות האתר', 'approved'),
  ('beit-knesset', 'כמה פעמים ביום קוראים קריאת שמע?', array['פעם אחת', 'פעמיים', 'שלוש פעמים', 'שבע פעמים'], 1, 'ברכות ב, א', 'צוות האתר', 'approved'),
  ('beit-knesset', 'כמה ימים נמשך חג הסוכות לפי התורה (בלי שמיני עצרת)?', array['שישה', 'שבעה', 'שמונה', 'תשעה'], 1, 'ויקרא כג, לד', 'צוות האתר', 'approved'),
  ('beit-knesset', 'באיזה חג אוכלים מצות?', array['סוכות', 'שבועות', 'פסח', 'פורים'], 2, 'שמות יב', 'צוות האתר', 'approved');
end if;
end $$;

-- ===== עדכון 2 (כלול כאן להתקנה חדשה) =====

-- שלב (1 קל, 2 בינוני, 3 קשה) לכל שאלה
alter table public.questions add column if not exists level smallint not null default 1;
alter table public.questions drop constraint if exists questions_level_check;
alter table public.questions add constraint questions_level_check check (level between 1 and 3);

-- אפשר להציע שאלות לכל התחנות (גם משנה, גמרא, בית המקדש, דוד המלך והכוללים), גם לתחנות שיתווספו בעתיד
alter table public.questions drop constraint if exists questions_place_check;
alter table public.questions add constraint questions_place_check check (place ~ '^[a-z][a-z-]{1,29}$');

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
-- עדכון 3: שאלות לפרשת השבוע (לפי שם הפרשה, כדי שסבב שנתי לא ימחק אותן), פסוק ומקור, והשלמת הפסוק.
-- Supabase -> SQL Editor -> New query -> מדביקים את כל הקובץ -> Run. אפשר להריץ יותר מפעם אחת.
-- אחרי הרצה: אין למחוק שורות בטבלה כדי "לנקות" פרשה. האתר מסנן לפי שם הפרשה, והשאלות נשארות לשנה הבאה.

-- שם הפרשה (למשל lech-lecha), רק לשאלות של היכל פרשת השבוע
alter table public.questions add column if not exists parasha text;
alter table public.questions drop constraint if exists questions_parasha_check;
alter table public.questions add constraint questions_parasha_check check (parasha is null or parasha ~ '^[a-z-]{2,30}$');

-- הפסוק כמו שהוא בחומש, מקומו (למשל בראשית יב, ז), וציטוט מהפרשן שמסביר את התשובה (לא חובה)
alter table public.questions add column if not exists verse text;
alter table public.questions drop constraint if exists questions_verse_check;
alter table public.questions add constraint questions_verse_check check (verse is null or char_length(verse) <= 400);
alter table public.questions add column if not exists ref text;
alter table public.questions drop constraint if exists questions_ref_check;
alter table public.questions add constraint questions_ref_check check (ref is null or char_length(ref) <= 60);
alter table public.questions add column if not exists quote text;
alter table public.questions drop constraint if exists questions_quote_check;
alter table public.questions add constraint questions_quote_check check (quote is null or char_length(quote) <= 400);

create index if not exists questions_parasha_idx on public.questions (parasha);
