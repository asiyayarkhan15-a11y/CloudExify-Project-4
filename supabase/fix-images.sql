-- ============================================================================
-- Fix the menu photos.
--
-- The original seed used Unsplash photo IDs written from memory and never
-- verified. Several pointed at completely unrelated pictures (the lobster was
-- two people on a rooftop; the wagyu was an Indian thali).
--
-- STEP A — thirteen dishes now use real photos stored in the repo under assets/.
--          Self-hosted, so they can never break.
-- To add a photo later: save it into assets/, then Admin → Menu Management →
-- Edit → set the image URL to e.g. assets/wagyu.jpg
--
-- Run in Supabase → SQL Editor. Safe to re-run.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- STEP A — real photos, served from the repo
-- ---------------------------------------------------------------------------

update public.menu_items as m
set image_url = v.path
from (values
  ('Burrata & Heirloom Tomato',  'assets/burrata.jpg'),
  ('Beef Tartare Royale',        'assets/beef-tartare.jpg'),
  ('Foie Gras Parfait',          'assets/foie-gras.jpg'),
  ('Black Truffle Tagliatelle',  'assets/truffle-tagliatelle.jpg'),
  ('Duck à l''Orange',           'assets/duck.jpg'),
  ('Butter-Poached Lobster',     'assets/lobster.jpg'),
  ('Herb-Crusted Rack of Lamb',  'assets/lamb.jpg'),
  ('Hokkaido Scallops',          'assets/scallops.jpg'),
  ('Crème Brûlée Classique',     'assets/creme-brulee.jpg'),
  ('Seared Atlantic Salmon',     'assets/salmon.jpg'),
  ('Single Origin Espresso',     'assets/espresso.jpg'),
  ('Wagyu Ribeye MB7',           'assets/wagyu.jpg'),
  ('Truffle Wild Mushroom Soup', 'assets/mushroom-soup.jpg')
) as v(name, path)
where m.name = v.name;


-- ---------------------------------------------------------------------------
-- Check what every dish now points at.
-- ---------------------------------------------------------------------------

select
  category,
  name,
  case
    when image_url like 'assets/placeholder%' then '— placeholder —'
    when image_url like 'assets/%'            then 'local: ' || image_url
    else 'unsplash'
  end as image,
  price
from public.menu_items
order by category, price;
