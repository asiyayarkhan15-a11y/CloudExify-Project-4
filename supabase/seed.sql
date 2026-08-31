-- ============================================================================
-- Maison Noir — Starter menu
-- Run AFTER schema.sql, in Supabase → SQL Editor.
-- Only inserts if the menu is currently empty, so re-running is harmless.
--
-- If a photo doesn't load you'll see the bundled Maison Noir placeholder.
-- Swap the URL from Admin → Menu Management → Edit, no SQL needed.
-- ============================================================================

insert into public.menu_items (name, description, price, category, image_url, available)
select v.name, v.description, v.price, v.category, v.image_url, v.available
from (values

  -- ---- Starters ----------------------------------------------------------
  ('Burrata & Heirloom Tomato',
   'Creamy Puglian burrata, confit heirloom tomatoes, aged balsamic, basil oil.',
   1600.00, 'Starters',
   'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', true),

  ('Truffle Wild Mushroom Soup',
   'Velvet forest mushroom velouté finished with black winter truffle.',
   900.00, 'Starters',
   'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80', true),

  ('Beef Tartare Royale',
   'Hand-cut tenderloin, cured egg yolk, cornichon, sourdough crisps.',
   2200.00, 'Starters',
   'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=800&q=80', true),

  ('Foie Gras Parfait',
   'Silken parfait, spiced pear chutney, toasted brioche.',
   3500.00, 'Starters',
   'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=800&q=80', true),

  -- ---- Mains -------------------------------------------------------------
  ('Wagyu Ribeye MB7',
   '280g grain-fed wagyu, bone marrow butter, triple-cooked pommes.',
   8500.00, 'Mains',
   'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', true),

  ('Black Truffle Tagliatelle',
   'Hand-rolled pasta, 24-month parmesan, shaved Périgord truffle.',
   3200.00, 'Mains',
   'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80', true),

  ('Herb-Crusted Rack of Lamb',
   'New Zealand lamb, dijon herb crust, confit garlic jus, spring peas.',
   4500.00, 'Mains',
   'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', true),

  ('Saffron Risotto Milanese',
   'Carnaroli rice, Iranian saffron, aged parmesan, gold leaf.',
   2800.00, 'Mains',
   'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=800&q=80', true),

  ('Duck à l''Orange',
   'Slow-roasted breast, bitter orange glaze, dauphinoise potato.',
   3800.00, 'Mains',
   'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80', true),

  -- ---- Seafood -----------------------------------------------------------
  ('Butter-Poached Lobster',
   'Half Maine lobster, vanilla beurre blanc, charred leek.',
   6500.00, 'Seafood',
   'https://images.unsplash.com/photo-1553247407-23251ce81f59?auto=format&fit=crop&w=800&q=80', true),

  ('Seared Atlantic Salmon',
   'Crisp-skin fillet, dill crème fraîche, pickled fennel.',
   3500.00, 'Seafood',
   'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80', true),

  ('Hokkaido Scallops',
   'Three seared scallops, cauliflower velouté, brown butter, capers.',
   4000.00, 'Seafood',
   'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=800&q=80', true),

  -- ---- Desserts ----------------------------------------------------------
  ('Valrhona Chocolate Fondant',
   'Warm 70% fondant, salted caramel core, Tahitian vanilla ice cream.',
   1200.00, 'Desserts',
   'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80', true),

  ('Crème Brûlée Classique',
   'Madagascan vanilla custard, burnt sugar crust.',
   1000.00, 'Desserts',
   'https://images.unsplash.com/photo-1470324161839-ce2bb6fa6bc3?auto=format&fit=crop&w=800&q=80', true),

  ('Pistachio & Rose Cheesecake',
   'Baked cheesecake, Iranian pistachio, rose petal jam.',
   1100.00, 'Desserts',
   'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80', true),

  -- ---- Beverages ---------------------------------------------------------
  ('Sommelier''s Reserve Red',
   'Glass of the cellar''s current featured Bordeaux blend.',
   2500.00, 'Beverages',
   'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80', true),

  ('Noir Signature Mocktail',
   'Blackberry, elderflower, lime, cracked pink peppercorn.',
   750.00, 'Beverages',
   'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80', true),

  ('Single Origin Espresso',
   'Ethiopian Yirgacheffe, hand-pulled double shot.',
   550.00, 'Beverages',
   'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80', true)

) as v(name, description, price, category, image_url, available)
where not exists (select 1 from public.menu_items);
