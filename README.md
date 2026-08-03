# Maison Noir — Restaurant Full Stack Application

CloudExify Summer Internship 2026 · Web Development Month 2 · **Project 4**

| | |
|---|---|
| **Name** | _<your name>_ |
| **Registration number** | _CX-2026-XXXX_ |
| **Restaurant concept** | **Fine Dining** — dark elegant background, gold accents, serif headings, upscale menu |
| **Live link** | _<paste your Vercel URL here>_ |
| **Admin login (for PM testing)** | `admin@maisonnoir.com` / `_<password>_` |
| **Customer login (for PM testing)** | `customer@maisonnoir.com` / `_<password>_` |

> Fill in the five blanks above before you submit. The PM needs the admin
> credentials to grade the admin panel.

---

## What this is

A working ordering system with two separate experiences backed by one Supabase
database:

- **Customer panel** (`index.html`) — browse the menu, filter, search, sort,
  build a cart, place an order, and watch its status change.
- **Admin panel** (`admin.html`) — live stats, every order with a status
  dropdown, and full create/edit/delete control over the menu.

Orders placed by a customer appear in the admin dashboard immediately, and a
status change made by the admin appears on the customer's screen without a
refresh (Supabase Realtime).

## Tech stack

Bootstrap 5.3 (CDN) · Vanilla JavaScript (no build step) · Supabase (Auth +
PostgreSQL + Row Level Security + Realtime) · Deployed on Vercel.

---

## The four mandatory mechanics

| Mechanic | Where it lives |
|---|---|
| **Supabase Auth** | [`js/auth.js`](js/auth.js) — `handleRegister`, `handleLogin`, `handleLogout` |
| **Live database orders** | [`js/orders.js`](js/orders.js) `placeOrder()` → [`js/admin.js`](js/admin.js) `loadAllOrders()` |
| **Role-based access** | `requireAdmin()` in [`js/auth.js`](js/auth.js) + RLS policies in [`supabase/schema.sql`](supabase/schema.sql) |
| **Order status management** | `updateOrderStatus()` in [`js/admin.js`](js/admin.js), Pending → Preparing → Ready |

## Bonus challenges completed

- ✅ Toast notification when an item is added to the cart
- ✅ Sort menu by price (low→high / high→low)
- ✅ Real-time order status updates via Supabase Realtime
- ✅ Admin can toggle item availability on/off live
- ✅ Export orders to CSV from the admin panel

---

## Project structure

```
restaurant-app/
├── index.html            user panel — menu, cart, order history
├── admin.html            admin panel — stats, orders, menu management
├── login.html            shared login page
├── register.html         customer registration
├── css/
│   └── style.css         fine-dining theme (dark + gold)
├── js/
│   ├── supabase.js       client init + shared helpers (money, toast, escape)
│   ├── auth.js           login, register, logout, role check, page bootstrap
│   ├── menu.js           fetch + render menu, filter, search, sort
│   ├── cart.js           cart logic, persisted to sessionStorage
│   ├── orders.js         place order, order history, realtime status
│   └── admin.js          dashboard stats, order table, menu CRUD, CSV export
├── assets/
│   ├── logo.svg
│   └── placeholder.svg   fallback for any dish image that fails to load
├── supabase/
│   ├── schema.sql        tables, trigger, RLS policies, realtime  ← run first
│   ├── seed.sql          18 starter dishes                        ← run second
│   └── make-admin.sql    promote an account to admin              ← run third
└── README.md
```

---

## Setup — from zero to running

### 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → **New Project**.
2. Pick a name, a strong database password, and the region closest to you.
3. Wait ~2 minutes for it to finish provisioning.

### 2. Copy your credentials into the code

**Project Settings → API**, then copy:

- **Project URL** → paste over `SUPABASE_URL` in [`js/supabase.js`](js/supabase.js)
- **anon public** key → paste over `SUPABASE_ANON_KEY`

> ⚠️ Only ever use the **anon public** key here. The `service_role` key must
> never appear in frontend code — it bypasses every security policy.

### 3. Turn off email confirmation (for testing)

**Authentication → Sign In / Providers → Email** → turn **Confirm email**
**off**, and Save.

With it on, a new account has no session until the user clicks a link in their
inbox, so your PM can't register and order in one go. The app handles both
cases, but "off" is what you want for grading.

### 4. Create the tables

**SQL Editor → New query** → paste all of
[`supabase/schema.sql`](supabase/schema.sql) → **Run**.

Then do the same with [`supabase/seed.sql`](supabase/seed.sql) to load the
18 starter dishes.

### 5. Create your two test accounts

Open `register.html` and register twice:

- `customer@maisonnoir.com` — leave as a customer
- `admin@maisonnoir.com` — this one becomes the admin

Then open [`supabase/make-admin.sql`](supabase/make-admin.sql), change the
email if you used a different one, and **Run** it. Sign out and back in — you
should land on the dashboard.

### 6. Run it locally

Open the folder in VS Code and use the **Live Server** extension (right-click
`index.html` → *Open with Live Server*).

> Don't open the file directly with `file://` — Supabase Auth needs a real
> `http://` origin to store its session.

---

## Deploying to Vercel

1. Push this folder to a GitHub repo named `cloudexify-web-p4-yourname`.
2. [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Framework preset: **Other**. No build command, no output directory.
4. **Deploy** → you get `yourname-restaurant.vercel.app`.
5. Back in Supabase: **Authentication → URL Configuration** → set **Site URL**
   to your Vercel URL and add `https://your-app.vercel.app/**` to
   **Redirect URLs**.
6. Open the live link in an **incognito window** and run the checklist below.

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
| Narrow the window to phone width | Grid collapses cleanly |
| Browser console | No errors on any page |

---

## Security notes

The RLS policies in `schema.sql` do the real enforcement — the JavaScript role
check is only there to give a nicer redirect:

- A customer can **read only their own orders**, even by calling the API directly.
- A customer **cannot update any order's status** — that's admin-only.
- A customer **cannot change their own role** to `admin`; there is no
  self-update policy on `profiles` at all.
- Menu writes are admin-only; menu reads are public.
