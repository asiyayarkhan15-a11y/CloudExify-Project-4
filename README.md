# Maison Noir — Restaurant Full Stack Application

CloudExify Summer Internship 2026 · Web Development Month 2 · **Project 4**

| | |
|---|---|
| **Name** | Asiya Khan |
| **Registration number** | CX-INT-2026-GEN-0481 |
| **Restaurant concept** | **Fine Dining** — dark elegant background, gold accents, serif headings, upscale menu |
| **Live link** | https://cloud-exify-project-4.vercel.app |
| **Repository** | https://github.com/asiyayarkhan15-a11y/CloudExify-Project-4 |
| **Admin login** | `admin@maisonnoir.com` / `MaisonNoir#Admin2026` |
| **Customer login** | `guest@maisonnoir.com` / `MaisonNoir#Guest2026` |

> **Note for the PM:** this runs on Supabase's free tier, which pauses a project
> after a period of inactivity. If the menu doesn't load, the project just needs
> resuming — message me and I'll restore it in a minute.

---

## What it does

An ordering system with two separate experiences on one Supabase database.

**Customer panel** — browse 18 dishes, filter by category, search by name, sort
by price, build a cart that survives a refresh, place an order, and follow its
status.

**Admin panel** — four live stat cards, every order with a status dropdown, and
full create / edit / delete control over the menu.

An order placed by a customer appears in the admin dashboard immediately. A
status change made by the admin reaches the customer's screen without a refresh,
via Supabase Realtime.

**Stack:** Bootstrap 5.3 (CDN) · vanilla JavaScript, no build step · Supabase
(Auth + PostgreSQL + Row Level Security + Realtime) · deployed on Vercel.

---

## The four mandatory mechanics

| Mechanic | Where it lives |
|---|---|
| **Supabase Auth** | [`js/auth.js`](js/auth.js) — `handleRegister`, `handleLogin`, `handleLogout` |
| **Live database orders** | [`js/orders.js`](js/orders.js) `placeOrder()` → [`js/admin.js`](js/admin.js) `loadAllOrders()` |
| **Role-based access** | `requireAdmin()` in [`js/auth.js`](js/auth.js), enforced by RLS policies in [`supabase/schema.sql`](supabase/schema.sql) |
| **Order status management** | `updateOrderStatus()` in [`js/admin.js`](js/admin.js) — Pending → Preparing → Ready |

## Bonus challenges completed

- Toast notification when an item is added to the cart
- Sort menu by price, low→high and high→low
- Real-time order status updates via Supabase Realtime
- Admin can toggle item availability on and off live
- Export all orders to CSV from the admin panel

---

## Screenshots

Eleven captures of the live app are in [`screenshots/`](screenshots/), listed in
[`screenshots/README.md`](screenshots/README.md).

`08-admin-dashboard-pending.png` and `09-admin-status-updated.png` are a
before/after pair: the same order moves from `Pending` to `Preparing` and the
*Pending Orders* stat card recalculates from 1 to 0.

---

## Project structure

```
├── index.html                 customer panel — menu, cart, order history
├── admin.html                 admin panel — stats, orders, menu management
├── login.html                 shared login page
├── register.html              customer registration
├── css/
│   └── style.css              fine-dining theme (dark + gold)
├── js/
│   ├── boot.js                startup guard — surfaces load errors
│   ├── supabase.js            client init + shared helpers (money, toast, escape)
│   ├── auth.js                login, register, logout, role check, page bootstrap
│   ├── menu.js                fetch + render menu, filter, search, sort
│   ├── cart.js                cart logic, persisted to sessionStorage
│   ├── orders.js              place order, order history, realtime status
│   └── admin.js               dashboard stats, order table, menu CRUD, CSV export
├── assets/                    13 dish photos, logo, image placeholder
├── screenshots/               11 captures of the live app
├── supabase/
│   ├── schema.sql             tables, trigger, RLS policies, realtime
│   ├── seed.sql               the 18 menu items
│   ├── make-admin.sql         promote an account to admin
│   ├── rescale-pkr.sql        PKR pricing + non-alcoholic drinks menu
│   └── fix-images.sql         point dishes at the local photos
└── README.md
```

---

## Running it from scratch

**1. Create a Supabase project** at [supabase.com](https://supabase.com).

**2. Copy your credentials.** Project Settings → API. Paste the **Project URL**
and **anon public** key into the top of [`js/supabase.js`](js/supabase.js).

> Only the **anon public** key belongs in frontend code. The `service_role` key
> bypasses every security policy and must never be committed.

**3. Turn off email confirmation.** Authentication → Sign In / Providers →
Email → **Confirm email** off. With it on, a new account has no session until
the user clicks a link in their inbox.

**4. Create the tables.** SQL Editor → run [`supabase/schema.sql`](supabase/schema.sql),
then [`supabase/seed.sql`](supabase/seed.sql).

**5. Register two accounts** through `register.html`, then run
[`supabase/make-admin.sql`](supabase/make-admin.sql) to promote one to admin.

**6. Serve it over HTTP** — VS Code's Live Server, or any static server. Opening
the files directly with `file://` breaks auth, because Supabase needs a real
origin to store the session.

**7. After deploying,** add the live URL to Supabase → Authentication → URL
Configuration, as both **Site URL** and a **Redirect URL** ending in `/**`.

---

## Notes on the implementation

**Localised for Pakistan.** Prices are in PKR at levels an upscale restaurant in
Karachi would actually charge — PKR 550 for an espresso, PKR 8,500 for the
ribeye. The drinks list is non-alcoholic; the wine was replaced with a Kashmiri
saffron kahwa.

**Dish photos are self-hosted** in `assets/` rather than hotlinked, so no image
can break later.

**The client is named `supabaseClient`, not `supabase`.** The CDN bundle already
publishes itself as the global `window.supabase`, and a top-level
`const supabase = ...` collides with it, throwing
`Identifier 'supabase' has already been declared` — a parse-time error that kills
the whole file before a single line runs. See the comment in
[`js/supabase.js`](js/supabase.js).

**Security is enforced in the database, not the browser.** The JavaScript role
check only provides a nicer redirect; the RLS policies do the real work:

- A customer can read only their own orders, even calling the API directly.
- A customer cannot update any order's status — that is admin-only.
- A customer cannot change their own role to `admin`; there is no self-update
  policy on `profiles` at all.
- Menu writes are admin-only; menu reads are public.

---

## Testing checklist

| Test | Expected |
|---|---|
| Register a new customer | Account created, redirected to the menu |
| Login with that account | Session created, menu loads |
| Filter by category | Only that category's dishes shown |
| Type in the search box | Results narrow as you type |
| Sort by price | Order flips correctly both ways |
| Add items to cart | Badge counts up, total recalculates |
| Refresh the page | Cart is still there (sessionStorage) |
| Place an order | Order number toast, cart clears, order in history |
| Open `admin.html` as a customer | Bounced straight back to `index.html` |
| Login as admin | Dashboard loads with four live stat cards |
| Change an order's status | Badge updates; customer sees it live |
| Add / edit / delete a dish | Change appears on the customer menu |
| Toggle a dish unavailable | It disappears from the customer menu |
| Export CSV | File downloads with all orders |
| Narrow to phone width | Bootstrap grid collapses cleanly |
| Browser console | No errors on any page |
