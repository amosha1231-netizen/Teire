-- עדכון 10: יהלומים 💎. מטבע שקונים רק בכסף אמיתי (דרך Apple / Google), ונשמר בשרת כדי שאי אפשר יהיה לזייף.
-- Supabase -> SQL Editor -> New query -> מדביקים את כל הקובץ -> Run. אפשר להריץ יותר מפעם אחת.
-- חשוב: ב-Authentication -> Sign In / Providers להפעיל את "Allow anonymous sign-ins". כל שחקן מקבל חשבון שקט בלי הרשמה.
--
-- איך זה עובד:
--   * רק השרת מוסיף יהלומים, אחרי ש-RevenueCat מאשר תשלום (supabase/functions/revenuecat-webhook).
--   * רק השרת קובע מחירים (הטבלה gem_items) ומוריד יהלומים בקנייה (buy_gem_item).
--   * השחקן יכול רק לקרוא את היתרה שלו ואת הפריטים שלו.

create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gems integer not null default 0 check (gems >= 0),
  updated_at timestamptz not null default now()
);

-- כל שינוי ביתרה, עם מזהה העסקה בחנות כדי שתשלום אחד לא ייספר פעמיים.
create table if not exists public.gem_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null,
  reason text not null,
  ext_id text unique,
  created_at timestamptz not null default now()
);

-- מחירון. המזהה הוא "slot:id" כמו ב-player.owned (למשל shirt:#06b6d4).
create table if not exists public.gem_items (
  id text primary key,
  name text not null,
  price integer not null check (price > 0)
);

create table if not exists public.owned_gem_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null references public.gem_items(id),
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

insert into public.gem_items (id, name, price) values
  ('shirt:#06b6d4', 'חולצה טורקיז', 30),
  ('shirt:#ec4899', 'חולצה ורודה', 30),
  ('shirt:#111827', 'חולצה שחורה מלכותית', 50),
  ('shirt:#c0c0c0', 'חולצת כסף', 80)
on conflict (id) do update set name = excluded.name, price = excluded.price;

alter table public.wallets enable row level security;
alter table public.gem_ledger enable row level security;
alter table public.gem_items enable row level security;
alter table public.owned_gem_items enable row level security;
revoke all on public.wallets, public.gem_ledger, public.gem_items, public.owned_gem_items from anon, authenticated;
grant select on public.wallets, public.gem_ledger, public.owned_gem_items to authenticated;
grant select on public.gem_items to anon, authenticated;

drop policy if exists "own wallet" on public.wallets;
create policy "own wallet" on public.wallets for select to authenticated using (auth.uid() = user_id);
drop policy if exists "own ledger" on public.gem_ledger;
create policy "own ledger" on public.gem_ledger for select to authenticated using (auth.uid() = user_id);
drop policy if exists "own gem items" on public.owned_gem_items;
create policy "own gem items" on public.owned_gem_items for select to authenticated using (auth.uid() = user_id);
drop policy if exists "price list" on public.gem_items;
create policy "price list" on public.gem_items for select to anon, authenticated using (true);

-- היתרה והפריטים של השחקן המחובר.
create or replace function public.my_gems()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'gems', coalesce((select gems from wallets where user_id = auth.uid()), 0),
    'owned', coalesce((select json_agg(item_id) from owned_gem_items where user_id = auth.uid()), '[]'::json)
  );
$$;

-- קנייה: המחיר נלקח מהשרת, והיתרה יורדת רק אם יש מספיק.
create or replace function public.buy_gem_item(p_item text)
returns json language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  cost integer;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select price into cost from gem_items where id = p_item;
  if cost is null then raise exception 'unknown item'; end if;
  if exists (select 1 from owned_gem_items where user_id = uid and item_id = p_item) then return my_gems(); end if;
  update wallets set gems = gems - cost, updated_at = now() where user_id = uid and gems >= cost;
  if not found then raise exception 'not enough gems'; end if;
  insert into gem_ledger (user_id, delta, reason) values (uid, -cost, 'buy ' || p_item);
  insert into owned_gem_items (user_id, item_id) values (uid, p_item);
  return my_gems();
end $$;

-- הוספה או הורדה של יהלומים. רק השרת (service_role) יכול לקרוא לזה, מתוך ה-webhook.
-- p_ext_id הוא מזהה העסקה: אם כבר נרשם, לא קורה כלום.
create or replace function public.credit_gems(p_user uuid, p_delta integer, p_ext_id text, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_ext_id is not null and exists (select 1 from gem_ledger where ext_id = p_ext_id) then return; end if;
  insert into wallets (user_id, gems) values (p_user, greatest(p_delta, 0))
    on conflict (user_id) do update set gems = greatest(wallets.gems + p_delta, 0), updated_at = now();
  insert into gem_ledger (user_id, delta, reason, ext_id) values (p_user, p_delta, p_reason, p_ext_id);
end $$;

-- מחיקת החשבון של השחקן המחובר וכל מה שקשור אליו (Apple ו-Google דורשות אפשרות כזו).
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke all on function public.my_gems() from public, anon;
revoke all on function public.buy_gem_item(text) from public, anon;
revoke all on function public.credit_gems(uuid, integer, text, text) from public, anon, authenticated;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.my_gems() to authenticated;
grant execute on function public.buy_gem_item(text) to authenticated;
grant execute on function public.credit_gems(uuid, integer, text, text) to service_role;
grant execute on function public.delete_my_account() to authenticated;
