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

-- Upsert new products. image_path points at photos bundled in public/products/
-- (served as /products/...); upload real photos in Admin -> Products to override.
insert into public.products (id, name, description, price, stock, active, art, image_path) values
  ('siomai-beef',        '6 pcs Beef Siomai',      'Six pieces of steamed beef siomai.',                  35, 100, true, 'siomai',       '/products/siomai-beef.jpg'),
  ('siomai-chicken',     '6 pcs Chicken Siomai',   'Six pieces of steamed chicken siomai.',               35, 100, true, 'siomai',       '/products/siomai-chicken.jpg'),
  ('beef-siomai-rice',   'Beef Siomai Rice',       'Beef siomai served over steamed rice.',               45,  60, true, 'rice',         '/products/beef-siomai-rice.jpg'),
  ('chicken-siomai-rice','Chicken Siomai Rice',    'Chicken siomai served over steamed rice.',            45,  60, true, 'rice',         '/products/chicken-siomai-rice.jpg'),
  ('big-chicken-siopao', 'Big Chicken Siopao',     'Large steamed bun with savory chicken filling.',      25,  60, true, 'siopao',       '/products/big-chicken-siopao.jpg'),
  ('small-siopao',       'Small Siopao',           'Small steamed bun with savory filling.',              15,  60, true, 'siopao',       '/products/small-siopao.jpg'),
  ('choco-mini-siopao',  'Choco Mini Siopao',      'Mini steamed bun with sweet chocolate filling.',      18,  40, true, 'siopao-choco', '/products/choco-mini-siopao.jpg'),
  ('ube-mini-siopao',    'Ube Mini Siopao',        'Mini steamed bun with sweet ube filling.',            18,  40, true, 'siopao-ube',   '/products/ube-mini-siopao.jpg'),
  ('coke-mini',          'Coke Mini',              'Chilled Coca-Cola mini.',                             16,  80, true, 'coke',         '/products/coke-mini.jpg'),
  ('wilkins-330ml',      'Wilkins 330ml',          'Purified drinking water, 330 ml.',                    15,  80, true, 'water',        '/products/wilkins-330ml.jpg')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  -- stock is deliberately NOT reset here: re-running this file must not
  -- clobber inventory that has already been adjusted in Admin -> Products.
  active = excluded.active,
  art = excluded.art,
  image_path = excluded.image_path;

-- Clear combos/featured
update public.display_settings
set combos = '[]'::jsonb,
    featured_product_id = null
where id = true;
