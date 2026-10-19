-- Snack & Sip — migration 006: fair-day menu update
-- Paste this whole file into Supabase Studio -> SQL Editor -> Run.
-- Run AFTER 005. Every statement is idempotent / safe to re-run
-- (note: re-running resets prices to the values below).

-- 1) Old menu items leave the shelves. Rows are kept (soft-hide) so past
--    orders and their order_lines stay valid; the app hides inactive
--    products from the menu, POS, and Display board.
update public.products
set active = false
where id in (
  'saucer', 'waffle', 'palamig',          -- retired flavors
  'siopao', 'siopao-mini',                -- asado variants aren't sold
  'siopao-ube', 'siopao-choco'            -- size-less variants (first pass)
);

-- 2) New menu (upsert). Prices and stocks are starting values — tweak any
--    time from Admin -> Products.
insert into public.products (id, name, description, price, stock, active, art) values
  ('siomai',             'Siomai',                  'Four pieces, steamed, with chili oil on the side.',  35, 100, true, 'siomai'),
  ('siomai-rice',        'Siomai Rice',             'Steamed siomai over rice, drizzled with savory sauce.', 55, 60, true, 'rice'),
  ('siopao-big-ube',     'Siopao Big (Ube)',        'Big steamed bun with sweet ube filling.',            35,  30, true, 'siopao-ube'),
  ('siopao-big-choco',   'Siopao Big (Chocolate)',  'Big steamed bun with rich chocolate filling.',       35,  30, true, 'siopao-choco'),
  ('siopao-mini-ube',    'Siopao Mini (Ube)',       'Bite-size steamed bun with sweet ube filling.',      20,  30, true, 'siopao-ube'),
  ('siopao-mini-choco',  'Siopao Mini (Chocolate)', 'Bite-size steamed bun with rich chocolate filling.', 20,  30, true, 'siopao-choco'),
  ('egg',                'Add Egg',                 'Add a fried egg to any rice or siopao order.',       10,  60, true, 'egg')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  stock = excluded.stock,
  active = excluded.active,
  art = excluded.art;

-- 3) Display board: old combo promos referenced hidden items — clear them
--    and reset the featured pick. Re-add promos from Display -> gear icon.
update public.display_settings
set combos = '[]'::jsonb,
    featured_product_id = null
where id = true;

-- 4) Loyalty reward: the old label ("Free flying saucer") referenced a
--    retired item. Placeholder until the reward is decided — change
--    v_label below and re-run this function block.
create or replace function public.redeem_reward()
returns public.redemptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_cost integer := 10;
  v_label text := 'Free snack';
  v_result public.redemptions;
begin
  if v_uid is null then
    raise exception 'Log in to redeem a reward.';
  end if;

  update public.profiles
    set points = points - v_cost
    where id = v_uid and points >= v_cost;
  if not found then
    raise exception 'Not enough points yet.';
  end if;

  insert into public.redemptions (profile_id, label)
    values (v_uid, v_label)
    returning * into v_result;

  return v_result;
end;
$$;

revoke execute on function public.redeem_reward() from public, anon;
grant execute on function public.redeem_reward() to authenticated;

-- ============================================================ verify (optional)
-- select id, name, price, stock, active, art from public.products order by id;
-- expect active: siomai, siomai-rice, siopao-big-ube, siopao-big-choco,
--                 siopao-mini-ube, siopao-mini-choco, egg
-- expect inactive: saucer, waffle, palamig, siopao, siopao-mini,
--                  siopao-ube, siopao-choco
