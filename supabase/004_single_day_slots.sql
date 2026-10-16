-- ============================================================
-- 004: single-day fair — Oct 20, 2026 @ TCU Foodhall
-- Replaces the Day 1 / Day 2 placeholder slots with four Oct 20 windows.
-- Rows are UPDATED in place (ids preserved) because existing orders
-- reference pickup_slots via orders.pickup_slot_id. `taken` counts are
-- left untouched so slot accounting for existing orders stays valid.
-- Idempotent: safe to re-run.
-- ============================================================

update public.pickup_slots
set label = 'Oct 20 · 9:00–11:00 AM',
    starts_at = timestamptz '2026-10-20 09:00:00+08',
    capacity = 999
where id = 'd1-am';

update public.pickup_slots
set label = 'Oct 20 · 11:00 AM–1:00 PM',
    starts_at = timestamptz '2026-10-20 11:00:00+08',
    capacity = 999
where id = 'd1-pm';

update public.pickup_slots
set label = 'Oct 20 · 1:00–3:00 PM',
    starts_at = timestamptz '2026-10-20 13:00:00+08',
    capacity = 999
where id = 'd2-am';

update public.pickup_slots
set label = 'Oct 20 · 3:00–5:00 PM',
    starts_at = timestamptz '2026-10-20 15:00:00+08',
    capacity = 999
where id = 'd2-pm';
