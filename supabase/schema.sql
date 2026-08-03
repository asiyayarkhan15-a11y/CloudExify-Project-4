-- ============================================================================
-- Maison Noir — Database schema
-- Paste this ENTIRE file into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  full_name  text,
  role       text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id          serial primary key,
  name        text not null,
  description text,
  price       numeric(10,2) not null check (price >= 0),
  category    text,
  image_url   text,
  available   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.orders (
  id         serial primary key,
  user_id    uuid references auth.users on delete set null,
  items      jsonb not null,
  total      numeric(10,2) not null check (total >= 0),
  status     text not null default 'Pending'
             check (status in ('Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx     on public.orders (user_id);
create index if not exists orders_created_at_idx  on public.orders (created_at desc);
create index if not exists menu_items_category_idx on public.menu_items (category);


-- ---------------------------------------------------------------------------
-- 2. AUTO-CREATE A PROFILE WHEN SOMEONE REGISTERS
--    Doing this in a trigger (instead of only from the browser) means the
--    profile row always exists — even when email confirmation is switched on
--    and the browser has no session immediately after sign-up.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------------
-- 3. ADMIN HELPER
--    SECURITY DEFINER is essential: it lets a policy ON profiles read FROM
--    profiles without triggering infinite RLS recursion.
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;


-- ---------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

alter table public.profiles   enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders     enable row level security;

-- ---- profiles --------------------------------------------------------------
-- You can read your own profile; an admin can read everyone's (needed to show
-- customer names in the orders dashboard).
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

-- Deliberately NO self-update policy: if customers could update their own row
-- they could set their own role to 'admin'. Only admins may edit profiles.
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- ---- menu_items ------------------------------------------------------------
-- Anyone may read the menu; only admins may change it.
drop policy if exists menu_select_all on public.menu_items;
create policy menu_select_all on public.menu_items
  for select using (true);

drop policy if exists menu_insert_admin on public.menu_items;
create policy menu_insert_admin on public.menu_items
  for insert with check (public.is_admin());

drop policy if exists menu_update_admin on public.menu_items;
create policy menu_update_admin on public.menu_items
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists menu_delete_admin on public.menu_items;
create policy menu_delete_admin on public.menu_items
  for delete using (public.is_admin());

-- ---- orders ----------------------------------------------------------------
-- Customers see only their own orders; admins see all.
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists orders_insert_own on public.orders;
create policy orders_insert_own on public.orders
  for insert with check (auth.uid() = user_id);

-- Only an admin may change a status — a customer cannot mark their own
-- order 'Ready'.
drop policy if exists orders_update_admin on public.orders;
create policy orders_update_admin on public.orders
  for update using (public.is_admin()) with check (public.is_admin());


-- ---------------------------------------------------------------------------
-- 5. REALTIME
--    Lets the customer see a status change and the admin see a new order
--    without refreshing. RLS still applies to realtime messages.
-- ---------------------------------------------------------------------------

alter table public.orders replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.orders;
exception
  when duplicate_object then null;
end;
$$;
