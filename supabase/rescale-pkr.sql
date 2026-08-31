-- ============================================================================
-- Set the menu to realistic Pakistani upscale-restaurant prices (PKR).
--
-- The original seed used AED figures (68, 340, ...). Shown as PKR those read
-- as far too cheap, so this sets deliberate PKR prices in line with what a
-- high-end restaurant in Karachi / Lahore / Islamabad actually charges.
--
-- Run once in Supabase → SQL Editor. Safe to re-run: it matches on name and
-- simply sets the same values again.
-- ============================================================================

update public.menu_items as m
set price = v.new_price
from (values
  -- Starters ---------------------------------------------------------------
  ('Truffle Wild Mushroom Soup',      900),
  ('Burrata & Heirloom Tomato',      1600),
  ('Beef Tartare Royale',            2200),
  ('Foie Gras Parfait',              3500),
  -- Mains ------------------------------------------------------------------
  ('Saffron Risotto Milanese',       2800),
  ('Black Truffle Tagliatelle',      3200),
  ('Duck à l''Orange',               3800),
  ('Herb-Crusted Rack of Lamb',      4500),
  ('Wagyu Ribeye MB7',               8500),
  -- Seafood ----------------------------------------------------------------
  ('Seared Atlantic Salmon',         3500),
  ('Hokkaido Scallops',              4000),
  ('Butter-Poached Lobster',         6500),
  -- Desserts ---------------------------------------------------------------
  ('Crème Brûlée Classique',         1000),
  ('Pistachio & Rose Cheesecake',    1100),
  ('Valrhona Chocolate Fondant',     1200),
  -- Beverages --------------------------------------------------------------
  ('Single Origin Espresso',          550),
  ('Noir Signature Mocktail',         750),
  ('Sommelier''s Reserve Red',       2500)
) as v(name, new_price)
where m.name = v.name;


-- ---------------------------------------------------------------------------
-- Confirm — all 18 dishes with their new PKR prices.
-- ---------------------------------------------------------------------------

select category, name, price
from public.menu_items
order by category, price;


-- ---------------------------------------------------------------------------
-- OPTIONAL — the test order was placed while prices were still AED-scale, so
-- its total no longer matches its items. Delete it and place a fresh one so
-- the admin dashboard is consistent.
-- ---------------------------------------------------------------------------

-- delete from public.orders where id = 1;
