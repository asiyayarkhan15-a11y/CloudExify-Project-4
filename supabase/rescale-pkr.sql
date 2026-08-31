-- ============================================================================
-- Localise the menu for Pakistan: PKR prices + no alcohol.
--
-- 1. Replaces the wine item with a Kashmiri saffron kahwa.
-- 2. Sets realistic PKR prices for an upscale restaurant in Karachi /
--    Lahore / Islamabad. (The original seed used AED figures — 68, 340 — which
--    read as absurdly cheap once the currency label changed to PKR.)
--
-- Run once in Supabase → SQL Editor. Safe to re-run.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- STEP 1 — Swap the wine for a non-alcoholic house drink.
-- Runs first so the price update below can match on the new name.
-- ---------------------------------------------------------------------------

update public.menu_items
set name        = 'Kashmiri Saffron Kahwa',
    description = 'Green tea steeped with saffron, green cardamom and slivered almonds.',
    image_url   = 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=800&q=80'
where name = 'Sommelier''s Reserve Red';


-- ---------------------------------------------------------------------------
-- STEP 2 — Set PKR prices.
-- ---------------------------------------------------------------------------

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
  ('Kashmiri Saffron Kahwa',          650),
  ('Noir Signature Mocktail',         750)
) as v(name, new_price)
where m.name = v.name;


-- ---------------------------------------------------------------------------
-- STEP 3 — Confirm. Should list 18 dishes, none alcoholic.
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
