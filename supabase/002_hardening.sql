-- Snack & Sip — migration 002: auth hardening + order automation
-- Paste this whole file into Supabase Studio -> SQL Editor -> Run.
-- Run AFTER schema.sql (every statement is idempotent / safe to re-run).

-- Claim-code generation needs pgcrypto; on Supabase it lives in the
-- extensions schema, which the pinned search_path below must include.
create extension if not exists "pgcrypto" with schema extensions;

-- ============================================================ sequences
-- Race-safe order numbers (PO-001 / WI-001) and queue numbers.
create sequence if not exists public.order_number_po;
create sequence if not exists public.order_number_wi;
create sequence if not exists public.queue_number;

-- ============================================================ orders: before insert
-- Fills order_number (column stays NOT NULL) and the walk-in queue number.
create or replace function public.assign_order_identity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.order_number is null or new.order_number = '' then
    if new.type = 'pre_order' then
      new.order_number := 'PO-' || lpad(nextval('public.order_number_po')::text, 3, '0');
    else
      new.order_number := 'WI-' || lpad(nextval('public.order_number_wi')::text, 3, '0');
    end if;
  end if;
  if new.type = 'walk_in' and new.queue_number is null then
    new.queue_number := nextval('public.queue_number');
  end if;
  return new;
end;
$$;

drop trigger if exists assign_order_identity on public.orders;
create trigger assign_order_identity
  before insert on public.orders
  for each row execute function public.assign_order_identity();

-- ============================================================ orders: before update (queue)
-- Pre-orders get their queue number the moment they are confirmed.
create or replace function public.assign_queue_on_confirm()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'confirmed'
     and old.status <> 'confirmed'
     and new.type = 'pre_order'
     and new.queue_number is null
  then
    new.queue_number := nextval('public.queue_number');
  end if;
  return new;
end;
$$;

drop trigger if exists assign_queue_on_confirm on public.orders;
create trigger assign_queue_on_confirm
  before update of status on public.orders
  for each row execute function public.assign_queue_on_confirm();

-- ============================================================ orders: guard (security)
-- Customers may only submit a payment proof on their own order.
-- Everything else (status, totals, points, claim codes...) is admin/DB only.
-- Closes: self-verification of payment, self-completion for free points,
-- and total/claim-code tampering through the permissive update policy.
create or replace function public.guard_order_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admins (booth) keep full control through RLS is_admin() policies.
  if public.is_admin() then
    return new;
  end if;

  if new.customer_id is null or new.customer_id <> auth.uid() then
    raise exception 'You can only update your own order.';
  end if;

  -- Payment proof submission: pending/rejected -> for_verification only.
  if new.payment_status is distinct from old.payment_status then
    if not (
      old.payment_status in ('pending_payment', 'rejected')
      and new.payment_status = 'for_verification'
    ) then
      raise exception 'This payment status change is not allowed.';
    end if;
  end if;

  if new.status is distinct from old.status
     or new.total is distinct from old.total
     or new.order_number is distinct from old.order_number
     or new.type is distinct from old.type
     or new.customer_id is distinct from old.customer_id
     or new.customer_name is distinct from old.customer_name
     or new.payment_method is distinct from old.payment_method
     or new.pickup_slot_id is distinct from old.pickup_slot_id
     or new.pickup_label is distinct from old.pickup_label
     or new.claim_code is distinct from old.claim_code
     or new.claimed_at is distinct from old.claimed_at
     or new.queue_number is distinct from old.queue_number
     or new.points_awarded is distinct from old.points_awarded
  then
    raise exception 'Not allowed to change that field.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_order_update on public.orders;
create trigger guard_order_update
  before update on public.orders
  for each row execute function public.guard_order_update();

-- ============================================================ stock on confirm (replace 001)
-- Walk-in stock is consumed line-by-line (see order_lines trigger below).
-- Pre-order stock + slot capacity are consumed when admin verifies.
drop trigger if exists on_preorder_confirmed on public.orders;
drop function if exists public.consume_stock_on_confirm();

create or replace function public.handle_preorder_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  line record;
begin
  if new.status = 'confirmed'
     and old.status <> 'confirmed'
     and new.type = 'pre_order'
  then
    for line in
      select product_id, qty from public.order_lines where order_id = new.id
    loop
      update public.products
        set stock = stock - line.qty
        where id = line.product_id and stock >= line.qty;
      if not found then
        raise exception 'Insufficient stock for %', line.product_id;
      end if;
    end loop;

    if new.pickup_slot_id is not null then
      update public.pickup_slots
        set taken = taken + 1
        where id = new.pickup_slot_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists handle_preorder_confirmed on public.orders;
create trigger handle_preorder_confirmed
  after update of status on public.orders
  for each row execute function public.handle_preorder_confirmed();

-- ============================================================ stock for walk-in lines
-- Fires inside create_walk_in(); raises (rolling back the whole order)
-- if a product ran out between validation and insert.
create or replace function public.consume_walkin_stock_line()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type text;
begin
  select type into v_type from public.orders where id = new.order_id;
  if v_type = 'walk_in' then
    update public.products
      set stock = stock - new.qty
      where id = new.product_id and stock >= new.qty;
    if not found then
      raise exception 'Insufficient stock for %', new.product_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists consume_walkin_stock_line on public.order_lines;
create trigger consume_walkin_stock_line
  after insert on public.order_lines
  for each row execute function public.consume_walkin_stock_line();

-- ============================================================ profiles: close privilege escalation
-- The 001 update policies only check the row id, which would let a user
-- set their own role='admin' or inflate their own points. Column-level
-- grants fix that: clients may only edit their display name.
-- (points/role change via triggers + SECURITY DEFINER functions only)
revoke update on table public.profiles from anon, authenticated;
grant update (name) on table public.profiles to authenticated;

-- ============================================================ redemptions: close free rewards
-- 001 allowed inserting redemptions directly with no points check.
drop policy if exists "insert own redemptions" on public.redemptions;
revoke insert on table public.redemptions from anon, authenticated;

-- Keep in sync with lib/constants.ts LOYALTY (rewardAt: 10, "Free flying saucer").
create or replace function public.redeem_reward()
returns public.redemptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_cost integer := 10;
  v_label text := 'Free flying saucer';
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

-- ============================================================ create_pre_order RPC
-- Server-side prices, stock checks, claim code and order number.
-- Clients no longer INSERT into orders/order_lines directly.
create or replace function public.create_pre_order(
  p_lines jsonb,
  p_pickup_slot_id text default null,
  p_pickup_label text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_name text;
  v_total integer := 0;
  v_claim text := '';
  v_order_id uuid;
  v_order_number text;
  v_line record;
  v_product public.products%rowtype;
  i integer;
begin
  if v_uid is null then
    raise exception 'Log in to place a pre-order.';
  end if;

  if p_lines is null or jsonb_array_length(p_lines) = 0 then
    raise exception 'Your cart is empty.';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_lines) l
    where coalesce(l->>'productId', '') = ''
       or coalesce(l->>'qty', '') !~ '^[1-9][0-9]*$'
  ) then
    raise exception 'Invalid order items.';
  end if;

  select name into v_name from public.profiles where id = v_uid;
  if v_name is null then
    raise exception 'Account not found.';
  end if;

  for v_line in
    select l->>'productId' as pid,
           sum((l->>'qty')::integer)::integer as qty
    from jsonb_array_elements(p_lines) l
    group by 1
  loop
    select * into v_product
      from public.products where id = v_line.pid and active;
    if not found then
      raise exception 'An item in your cart is no longer available.';
    end if;
    if v_product.stock < v_line.qty then
      raise exception '% is sold out (only % left).', v_product.name, v_product.stock;
    end if;
    v_total := v_total + v_product.price * v_line.qty;
  end loop;

  for i in 1..6 loop
    v_claim := v_claim || substr(
      'ABCDEFGHJKMNPQRSTUVWXYZ23456789',
      1 + (get_byte(gen_random_bytes(1), 0) % 31),
      1
    );
  end loop;

  insert into public.orders (
    type, customer_id, customer_name, total,
    payment_method, payment_status, status,
    pickup_slot_id, pickup_label, claim_code
  ) values (
    'pre_order', v_uid, v_name, v_total,
    'gcash', 'pending_payment', 'pending',
    p_pickup_slot_id, p_pickup_label, v_claim
  )
  returning id, order_number into v_order_id, v_order_number;

  insert into public.order_lines (order_id, product_id, name, qty, unit_price)
    select v_order_id, p.id, p.name, (l->>'qty')::integer, p.price
    from jsonb_array_elements(p_lines) l
    join public.products p on p.id = l->>'productId';

  return jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'claim_code', v_claim,
    'total', v_total
  );
end;
$$;

revoke execute on function public.create_pre_order(jsonb, text, text) from public, anon;
grant execute on function public.create_pre_order(jsonb, text, text) to authenticated;

-- ============================================================ create_walk_in RPC
-- POS order: server-side prices, stock consumed by the order_lines trigger,
-- queue number assigned by the before-insert trigger.
create or replace function public.create_walk_in(
  p_lines jsonb,
  p_method text default 'cash',
  p_customer_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_total integer := 0;
  v_name text := null;
  v_claim text := '';
  v_order_id uuid;
  v_order_number text;
  v_queue integer;
  v_line record;
  v_product public.products%rowtype;
  i integer;
begin
  if not public.is_admin() then
    raise exception 'Admin only.';
  end if;

  if p_method not in ('cash', 'gcash') then
    raise exception 'Invalid payment method.';
  end if;

  if p_lines is null or jsonb_array_length(p_lines) = 0 then
    raise exception 'No items in this order.';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_lines) l
    where coalesce(l->>'productId', '') = ''
       or coalesce(l->>'qty', '') !~ '^[1-9][0-9]*$'
  ) then
    raise exception 'Invalid order items.';
  end if;

  if p_customer_id is not null then
    select name into v_name from public.profiles where id = p_customer_id;
    if v_name is null then
      raise exception 'Account not found.';
    end if;
  end if;

  for v_line in
    select l->>'productId' as pid,
           sum((l->>'qty')::integer)::integer as qty
    from jsonb_array_elements(p_lines) l
    group by 1
  loop
    select * into v_product from public.products where id = v_line.pid;
    if not found then
      raise exception 'Product not found.';
    end if;
    if v_product.stock < v_line.qty then
      raise exception '% is sold out (only % left).', v_product.name, v_product.stock;
    end if;
    v_total := v_total + v_product.price * v_line.qty;
  end loop;

  for i in 1..6 loop
    v_claim := v_claim || substr(
      'ABCDEFGHJKMNPQRSTUVWXYZ23456789',
      1 + (get_byte(gen_random_bytes(1), 0) % 31),
      1
    );
  end loop;

  insert into public.orders (
    type, customer_id, customer_name, total,
    payment_method, payment_status, status, claim_code
  ) values (
    'walk_in', p_customer_id, v_name, v_total,
    p_method, 'verified', 'confirmed', v_claim
  )
  returning id, order_number, queue_number into v_order_id, v_order_number, v_queue;

  insert into public.order_lines (order_id, product_id, name, qty, unit_price)
    select v_order_id, p.id, p.name, (l->>'qty')::integer, p.price
    from jsonb_array_elements(p_lines) l
    join public.products p on p.id = l->>'productId';

  return jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'queue_number', v_queue,
    'claim_code', v_claim,
    'total', v_total
  );
end;
$$;

revoke execute on function public.create_walk_in(jsonb, text, uuid) from public, anon;
grant execute on function public.create_walk_in(jsonb, text, uuid) to authenticated;

-- ============================================================ order inserts via RPC only
-- Without this, the 001 insert policies let a client forge total=0 orders.
revoke insert on table public.orders from anon, authenticated;
revoke insert on table public.order_lines from anon, authenticated;
drop policy if exists "customers create own pre-orders" on public.orders;
drop policy if exists "admin creates walk-ins" on public.orders;
drop policy if exists "insert lines with order" on public.order_lines;

-- ============================================================ storage: allow proof re-uploads
-- Resubmitting after a rejection overwrites the same path (upsert),
-- which needs an UPDATE policy on the customer's own folder.
drop policy if exists "customers update own proofs" on storage.objects;
create policy "customers update own proofs" on storage.objects
  for update using (
    bucket_id = 'payment-proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================ done — self-checks (optional)
-- select rolname from pg_roles where rolname in ('anon','authenticated');
-- \d+ public.orders        -- expect triggers: assign_order_identity, assign_queue_on_confirm,
--                          -- guard_order_update, handle_preorder_confirmed, on_order_completed
-- select has_table_privilege('authenticated', 'public.orders', 'insert');  -- expect false
-- select has_table_privilege('authenticated', 'public.profiles', 'update'); -- expect false
--   (column-level: name only)
