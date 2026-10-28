-- Snack & Sip — migration 007: new product lineup
-- Paste this whole file into Supabase Studio -> SQL Editor -> Run.
-- Run AFTER previous migrations. Every statement is idempotent / safe to re-run.

-- Hide previous lineup items to preserve history
update public.products
set active = false
where id in (
  'siomai', 'siomai-rice', 
  'siopao-big-ube', 'siopao-big-choco', 
  'siopao-mini-ube', 'siopao-mini-choco',
  'siopao', 'siopao-mini', 'siopao-ube', 'siopao-choco',
  'egg', 'saucer', 'waffle', 'palamig'
);

-- Upsert new products
insert into public.products (id, name, description, price, stock, active, art) values
  ('siomai-beef',        '6 pcs Beef Siomai',      'Six pieces of beef siomai, steamed.',                35, 100, true, 'siomai'),
  ('siomai-chicken',     '6 pcs Chicken Siomai',   'Six pieces of chicken siomai, steamed.',             35, 100, true, 'siomai'),
  ('beef-siomai-rice',   'Beef Siomai Rice',       'Beef siomai served over steamed rice.',               45,  60, true, 'rice'),
  ('chicken-siomai-rice','Chicken Siomai Rice',    'Chicken siomai served over steamed rice.',            45,  60, true, 'rice'),
  ('big-chicken-siopao', 'Big Chicken Siopao',     'Big steamed bun with chicken filling.',               25,  60, true, 'siopao'),
  ('small-siopao',       'Small Siopao',           'Small steamed bun with filling.',                     15,  60, true, 'siopao'),
  ('choco-mini-siopao',  'Choco Mini Siopao',      'Mini steamed bun with chocolate filling.',            18,  40, true, 'siopao-choco'),
  ('ube-mini-siopao',    'Ube Mini Siopao',        'Mini steamed bun with ube filling.',                  18,  40, true, 'siopao-ube'),
  ('coke-mini',          'Coke Mini',              'Chilled Coca-Cola mini bottle/can.',                  16,  80, true, 'palamig'),
  ('wilkins-330ml',      'Wilkins 330ml',          'Purified drinking water, 330ml.',                     15,  80, true, 'palamig')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  stock = excluded.stock,
  active = excluded.active,
  art = excluded.art;

-- Clear combos/featured
update public.display_settings
set combos = '[]'::jsonb,
    featured_product_id = null
where id = true;
