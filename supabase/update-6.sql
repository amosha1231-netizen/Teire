-- עדכון 6: שמונה רמות קושי במקום שלוש. הרמה השמינית היא הקשה ביותר.
-- Supabase -> SQL Editor -> New query -> מדביקים את כל הקובץ -> Run. אפשר להריץ יותר מפעם אחת.
alter table public.questions drop constraint if exists questions_level_check;
alter table public.questions add constraint questions_level_check check (level between 1 and 8);
