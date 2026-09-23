-- Snack & Sip — Supabase schema
-- Paste this whole file into Supabase Studio → SQL Editor → Run.

create extension if not exists "pgcrypto";

-- ============================================================ profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  points integer not null default 0 check (points >= 0),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================ catalog
create table public.products (
  id text primary key,
  name text not null,
  description text not null default '',
  price integer not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default true,
  art text not null
);

create table public.pickup_slots (
  id text primary key,
  label text not null,
  starts_at timestamptz,
  capacity integer not null default 999 check (capacity > 0),
  taken integer not null default 0 check (taken >= 0),
  check (taken <= capacity)
);

-- ============================================================ orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  type text not null check (type in ('pre_order', 'walk_in')),
  customer_id uuid references public.profiles (id),
  customer_name text,
  total integer not null check (total >= 0),
  payment_method text not null check (payment_method in ('cash', 'gcash')),
  payment_status text not null default 'pending_payment'
    check (payment_status in ('pending_payment', 'for_verification', 'verified', 'rejected')),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  proof_path text,
  gcash_reference text,
  pickup_slot_id text references public.pickup_slots (id),
  pickup_label text,
  queue_number integer,
  claim_code text not null unique,
  claimed_at timestamptz,
  points_awarded integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.order_lines (
  id bigserial primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id text not null references public.products (id),
  name text not null,
  qty integer not null check (qty > 0),
  unit_price integer not null check (unit_price >= 0)
);

create table public.loyalty_events (
  id bigserial primary key,
  customer_id uuid not null references public.profiles (id),
  order_id uuid not null references public.orders (id),
  points integer not null,
  kind text not null check (kind in ('base', 'preorder_bonus')),
  created_at timestamptz not null default now()
);

create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id),
  label text not null,
  redeemed_at timestamptz not null default now()
);

-- ============================================================ loyalty constants
-- 1 point per ₱25 base · +2 pre-order bonus · reward costs 10 points
create or replace function public.award_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base integer;
  v_bonus integer;
begin
  if new.status = 'completed'
     and old.status <> 'completed'
     and new.points_awarded = 0
  then
    v_base := floor(new.total / 25);
    v_bonus := case when new.type = 'pre_order' then 2 else 0 end;
    new.points_awarded := v_base + v_bonus;

    if new.customer_id is not null and new.points_awarded > 0 then
      update public.profiles
        set points = points + new.points_awarded
        where id = new.customer_id;

      insert into public.loyalty_events (customer_id, order_id, points, kind)
        values (new.customer_id, new.id, v_base, 'base');
      if v_bonus > 0 then
        insert into public.loyalty_events (customer_id, order_id, points, kind)
          values (new.customer_id, new.id, v_bonus, 'preorder_bonus');
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger on_order_completed
  before update of status on public.orders
  for each row execute function public.award_points();

-- stock is consumed when a pre-order is verified (status -> confirmed)
-- walk-in stock is consumed at insert time by the POS via decrement below
create or replace function public.consume_stock_on_confirm()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  line record;
begin
  if new.status = 'confirmed'
     and old.status in ('pending', 'for_verification_pending')
     and new.type = 'pre_order'
  then
    for line in select product_id, qty from public.order_lines where order_id = new.id
    loop
      update public.products
        set stock = stock - line.qty
        where id = line.product_id and stock >= line.qty;
      if not found then
        raise exception 'Insufficient stock for %', line.product_id;
      end if;
    end loop;
    update public.pickup_slots
      set taken = taken + 1
      where id = new.pickup_slot_id;
  end if;
  return new;
end;
$$;

create trigger on_preorder_confirmed
  after update of status on public.orders
  for each row execute function public.consume_stock_on_confirm();

-- ============================================================ RLS
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.pickup_slots enable row level security;
alter table public.orders enable row level security;
alter table public.order_lines enable row level security;
alter table public.loyalty_events enable row level security;
alter table public.redemptions enable row level security;

create policy "read own profile or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "update own profile" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

create policy "admin updates profiles" on public.profiles
  for update using (public.is_admin());

create policy "products readable" on public.products
  for select using (active or public.is_admin());

create policy "admin writes products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

create policy "slots readable" on public.pickup_slots
  for select using (true);

create policy "admin writes slots" on public.pickup_slots
  for all using (public.is_admin()) with check (public.is_admin());

create policy "read own orders or admin" on public.orders
  for select using (customer_id = auth.uid() or public.is_admin());

create policy "customers create own pre-orders" on public.orders
  for insert with check (
    auth.uid() is not null
    and type = 'pre_order'
    and customer_id = auth.uid()
    and status = 'pending'
    and payment_status = 'pending_payment'
  );

create policy "admin creates walk-ins" on public.orders
  for insert with check (public.is_admin());

create policy "submit own payment proof" on public.orders
  for update
  using (customer_id = auth.uid() and payment_status in ('pending_payment', 'rejected'))
  with check (customer_id = auth.uid());

create policy "admin manages orders" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

create policy "read lines of visible orders" on public.order_lines
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.customer_id = auth.uid() or public.is_admin())
    )
  );

create policy "insert lines with order" on public.order_lines
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.customer_id = auth.uid() or public.is_admin())
    )
  );

create policy "admin writes lines" on public.order_lines
  for update using (public.is_admin()) with check (public.is_admin());

create policy "read own loyalty events" on public.loyalty_events
  for select using (customer_id = auth.uid() or public.is_admin());

create policy "read own redemptions" on public.redemptions
  for select using (profile_id = auth.uid() or public.is_admin());

create policy "insert own redemptions" on public.redemptions
  for insert with check (profile_id = auth.uid() and public.is_admin() = false);

-- ============================================================ storage
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

create policy "customers upload proofs" on storage.objects
  for insert with check (
    bucket_id = 'payment-proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "read proofs if owner or admin" on storage.objects
  for select using (
    bucket_id = 'payment-proofs'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

-- ============================================================ seed
-- demo admin: create the auth user in Authentication → Users first
-- (email: admin@snacksip.local), then run:
-- update public.profiles set role = 'admin' where id = '<that-user-id>';

insert into public.products (id, name, description, price, stock, active, art) values
  ('saucer',  'Flying Saucer',        'Toasted ham and cheese sandwich, crusts sealed.', 25, 60, true, 'saucer'),
  ('siomai',  'Siomai',               'Four pieces, steamed, with chili oil on the side.', 35, 40, true, 'siomai'),
  ('siopao',  'Siopao',               'Fluffy steamed bun with asado filling.', 30, 40, true, 'siopao'),
  ('waffle',  'Waffle / Pancake',     'Stacked, butter on top, syrup drizzle.', 30, 35, true, 'waffle'),
  ('palamig', 'Palamig with Gulaman', 'Sealed cup, brown sugar syrup, sago and gulaman.', 25, 50, true, 'palamig')
on conflict (id) do nothing;

insert into public.pickup_slots (id, label) values
  ('d1-am', 'Day 1 · 9:00–11:00 AM'),
  ('d1-pm', 'Day 1 · 1:00–3:00 PM'),
  ('d2-am', 'Day 2 · 9:00–11:00 AM'),
  ('d2-pm', 'Day 2 · 1:00–3:00 PM')
on conflict (id) do nothing;
