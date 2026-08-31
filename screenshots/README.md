# Screenshots

Interface captures of the live app at https://cloud-exify-project-4.vercel.app

## Customer panel

| File | Shows |
|------|-------|
| `01-home-hero.png` | Landing page — navigation, hero, signed-in user |
| `02-menu-grid.png` | Menu with search, price sort and category filters — 18 dishes |
| `03-menu-dishes.png` | Dish cards with photos, categories and PKR prices |
| `04-menu-dishes-2.png` | Remaining dish cards |
| `05-my-orders.png` | Order history — order #2 with a Pending badge |
| `06-my-orders-pending.png` | Order history — order #3, itemised with total |

## Admin panel

| File | Shows |
|------|-------|
| `07-admin-dashboard-pending.png` | Dashboard — 4 live stat cards, orders table, **Pending Orders: 1** |
| `08-admin-status-updated.png` | Same order after the status dropdown changed it to **Preparing** — **Pending Orders: 0** |
| `09-admin-menu-management.png` | Menu management — thumbnails, availability switches, edit/delete |
| `10-admin-menu-full.png` | Full menu table across all categories |

## Note on 07 and 08

These two are a before/after pair for the **order status management** requirement.
The same order moves from `Pending` to `Preparing`, and the *Pending Orders*
stat card recalculates from 1 to 0 — the status write hitting Supabase and the
dashboard picking it up.
