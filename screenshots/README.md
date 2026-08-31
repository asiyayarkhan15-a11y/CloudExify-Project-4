# Screenshots

Captures of the live app at https://cloud-exify-project-4.vercel.app

## Desktop — customer panel

| File | Shows |
|------|-------|
| `01-home-hero.png` | Landing page — navigation, hero, signed-in user |
| `02-menu-grid.png` | Menu with search, price sort and category filters — 18 dishes |
| `03-menu-dishes.png` | Dish cards with photos, categories and PKR prices |
| `04-menu-dishes-2.png` | Remaining dish cards |
| `05-cart.png` | Cart drawer — items, quantity steppers, running total |
| `06-my-orders.png` | Order history — order #2 with a Pending badge |
| `07-my-orders-pending.png` | Order history — order #3, itemised with total |

## Desktop — admin panel

| File | Shows |
|------|-------|
| `08-admin-dashboard-pending.png` | Dashboard — 4 live stat cards, orders table, **Pending Orders: 1** |
| `09-admin-status-updated.png` | Same order after the dropdown changed it to **Preparing** — **Pending Orders: 0** |
| `10-admin-menu-management.png` | Menu management — thumbnails, availability switches, edit/delete |
| `11-admin-menu-full.png` | Full menu table across all categories |

## Mobile — iPhone, Safari

Real device captures, not a browser simulation.

| File | Shows |
|------|-------|
| `12-mobile-login.jpg` | Login page — card scales to a single column |
| `13-mobile-menu.jpg` | Menu — filters wrap to two rows, grid drops to 2 columns |
| `14-mobile-menu-scroll.jpg` | Dish cards further down the menu |
| `15-mobile-cart.jpg` | Cart drawer full width — quantity 2, PKR 19,400 total |
| `16-mobile-my-orders.jpg` | Order history with the Pending badge |
| `17-mobile-admin-dashboard.jpg` | Admin dashboard — stat cards stack 2×2, orders table scrolls |

## Note on 08 and 09

These two are a before/after pair for the **order status management** requirement.
The same order moves from `Pending` to `Preparing`, and the *Pending Orders* stat
card recalculates from 1 to 0 — the status write reaching Supabase and the
dashboard picking it up.
