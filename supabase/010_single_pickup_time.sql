-- Snack & Sip — migration 010: single pickup time
-- Run AFTER 009. Idempotent.
--
-- Keep the legacy d1-am id because orders.pickup_slot_id references it.
-- Other legacy rows are intentionally left in place for existing orders;
-- the application only exposes d1-am for new pickups.

insert into public.pickup_slots (id, label, starts_at, capacity)
values (
  'd1-am',
  'Oct 29 · 1:00 PM',
  timestamptz '2026-10-29 13:00:00+08',
  999
)
on conflict (id) do update
set label = excluded.label,
    starts_at = excluded.starts_at,
    capacity = excluded.capacity;
