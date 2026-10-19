-- Snack & Sip — migration 005: Display board settings
-- Paste this whole file into Supabase Studio -> SQL Editor -> Run.
-- Run AFTER schema.sql (every statement is idempotent / safe to re-run).

create table if not exists public.display_settings (
  id boolean primary key default true,
  featured_product_id text references public.products (id) on delete set null,
  sold_out_mode text not null default 'badge' check (sold_out_mode in ('badge', 'hide')),
  slide_seconds integer not null default 7 check (slide_seconds between 4 and 20),
  combos jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Exactly one settings row; the client always reads/writes id = true.
insert into public.display_settings (id) values (true)
on conflict (id) do nothing;

alter table public.display_settings enable row level security;

-- Booth config: admins only (the Display board runs signed-in as an admin).
drop policy if exists "admin reads display settings" on public.display_settings;
create policy "admin reads display settings" on public.display_settings
  for select using (public.is_admin());

drop policy if exists "admin writes display settings" on public.display_settings;
create policy "admin writes display settings" on public.display_settings
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin inserts display settings" on public.display_settings;
create policy "admin inserts display settings" on public.display_settings
  for insert with check (public.is_admin());

-- Combo promos (display-only; edit on Display -> gear icon).
-- Starts empty — add promos once the menu is final.

-- ============================================================ done — self-checks (optional)
-- select * from public.display_settings;              -- expect 1 row
-- select has_table_privilege('anon', 'public.display_settings', 'select');  -- expect false
