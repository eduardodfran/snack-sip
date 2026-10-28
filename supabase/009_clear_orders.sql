-- Remove all past orders (run in Supabase Studio -> SQL Editor).
-- Order matters: loyalty_events has no cascade; order_lines does cascade.
-- Stock and slot counters are NOT auto-restored by deletion, so they are
-- reset to the seed values below (comment out the resets if you want to keep
-- the current counts).

begin;

-- 1. Loyalty events referencing orders
delete from public.loyalty_events
where order_id in (select id from public.orders);

-- 2. Orders (order_lines cascade automatically)
delete from public.orders;

-- 3. Reset slot counters (no orders left)
update public.pickup_slots set taken = 0;

-- 4. (Optional) Reset product stock to the seed values
update public.products set stock = 100 where id in ('siomai-beef', 'siomai-chicken');
update public.products set stock = 60  where id in ('beef-siomai-rice', 'chicken-siomai-rice', 'big-chicken-siopao', 'small-siopao');
update public.products set stock = 40  where id in ('choco-mini-siopao', 'ube-mini-siopao');
update public.products set stock = 80  where id in ('coke-mini', 'wilkins-330ml');

commit;
