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
