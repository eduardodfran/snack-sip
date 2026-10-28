-- Snack & Sip — migration 008: Techno Fair date
-- Run AFTER 007. Idempotent.
--
-- The fair is Thursday, Oct 29, 2026 at 1:00 PM. Slot ids are legacy and kept
-- stable because orders.pickup_slot_id references them; only the date, labels
-- and windows change. `taken` counts are left untouched.

update public.pickup_slots
set label = 'Oct 29 · 9:00–11:00 AM',
    starts_at = timestamptz '2026-10-29 09:00:00+08',
    capacity = 999
where id = 'd1-am';

update public.pickup_slots
set label = 'Oct 29 · 11:00 AM–1:00 PM',
    starts_at = timestamptz '2026-10-29 11:00:00+08',
    capacity = 999
where id = 'd1-pm';

update public.pickup_slots
set label = 'Oct 29 · 1:00–3:00 PM',
    starts_at = timestamptz '2026-10-29 13:00:00+08',
    capacity = 999
where id = 'd2-am';

update public.pickup_slots
set label = 'Oct 29 · 3:00–5:00 PM',
    starts_at = timestamptz '2026-10-29 15:00:00+08',
    capacity = 999
where id = 'd2-pm';

-- If the table is empty (fresh project), seed the same slots.
insert into public.pickup_slots (id, label, starts_at) values
  ('d1-am', 'Oct 29 · 9:00–11:00 AM',   timestamptz '2026-10-29 09:00:00+08'),
  ('d1-pm', 'Oct 29 · 11:00 AM–1:00 PM', timestamptz '2026-10-29 11:00:00+08'),
  ('d2-am', 'Oct 29 · 1:00–3:00 PM',    timestamptz '2026-10-29 13:00:00+08'),
  ('d2-pm', 'Oct 29 · 3:00–5:00 PM',    timestamptz '2026-10-29 15:00:00+08')
on conflict (id) do nothing;
