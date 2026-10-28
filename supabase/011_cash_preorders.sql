-- Snack & Sip — migration 011: cash pre-orders
-- Run AFTER 010. Idempotent.
--
-- Cash pre-orders are confirmed immediately and paid at pickup.
-- GCash pre-orders keep the existing payment-proof verification flow.

drop function if exists public.create_pre_order(jsonb, text, text);

create or replace function public.assign_queue_on_confirm()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'confirmed'
     and (tg_op = 'INSERT' or old.status <> 'confirmed')
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
  before insert or update of status on public.orders
  for each row execute function public.assign_queue_on_confirm();

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
     and (tg_op = 'INSERT' or old.status <> 'confirmed')
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
  after insert or update of status on public.orders
  for each row execute function public.handle_preorder_confirmed();

create or replace function public.create_pre_order(
  p_lines jsonb,
  p_method text default 'gcash',
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

  if p_method not in ('cash', 'gcash') then
    raise exception 'Invalid payment method.';
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
    p_method,
    case when p_method = 'cash' then 'verified' else 'pending_payment' end,
    'pending',
    p_pickup_slot_id, p_pickup_label, v_claim
  )
  returning id, order_number into v_order_id, v_order_number;

  insert into public.order_lines (order_id, product_id, name, qty, unit_price)
    select v_order_id, p.id, p.name, (l->>'qty')::integer, p.price
    from jsonb_array_elements(p_lines) l
    join public.products p on p.id = l->>'productId';

  if p_method = 'cash' then
    update public.orders
      set status = 'confirmed'
      where id = v_order_id;
  end if;

  return jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'claim_code', v_claim,
    'total', v_total
  );
end;
$$;

revoke execute on function public.create_pre_order(jsonb, text, text, text) from public, anon;
grant execute on function public.create_pre_order(jsonb, text, text, text) to authenticated;
