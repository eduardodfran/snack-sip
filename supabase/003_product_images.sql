-- Snack & Sip — migration 003: product photos
-- Paste this whole file into Supabase Studio -> SQL Editor -> Run.
-- Safe to re-run (idempotent).

-- Optional real photo per product; the FoodArt drawing stays as fallback.
alter table public.products add column if not exists image_path text;

-- Public-read bucket so menu/POS photos load for signed-out visitors.
-- Photos are only writable by admins (policy below).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "admin writes product images" on storage.objects;
create policy "admin writes product images" on storage.objects
  for all using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
