-- ============================================================================
-- Promote a registered user to admin.
--
-- There is deliberately no way to do this from the browser: the RLS policies
-- block customers from editing their own role, so nobody can promote
-- themselves to admin.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- STEP 1 — DIAGNOSE. Select these lines and press Run.
--
-- `has_profile` = false means the auto-profile trigger never fired for that
-- account. A plain UPDATE would do nothing in that case — Step 2 handles it.
-- ---------------------------------------------------------------------------

select
  u.email,
  (p.id is not null) as has_profile,
  p.full_name,
  p.role,
  u.created_at
from auth.users u
left join public.profiles p on p.id = u.id
order by u.created_at;


-- ---------------------------------------------------------------------------
-- STEP 2 — PROMOTE. Put your admin email between the quotes, select these
-- lines and press Run.
--
-- This inserts the profile row if it is missing and updates it if it already
-- exists, so it works either way.
-- ---------------------------------------------------------------------------

insert into public.profiles (id, full_name, role)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
  'admin'
from auth.users u
where lower(u.email) = lower('admin@maisonnoir.com')     -- <<< YOUR ADMIN EMAIL
on conflict (id) do update set role = 'admin';


-- ---------------------------------------------------------------------------
-- STEP 3 — CONFIRM. One row should now say 'admin'.
-- ---------------------------------------------------------------------------

select u.email, p.full_name, p.role
from public.profiles p
join auth.users u on u.id = p.id
order by p.role, u.email;


-- ---------------------------------------------------------------------------
-- ONLY IF Step 1 showed has_profile = false for BOTH accounts:
-- the trigger on auth.users is not working. This backfills every missing
-- profile as a customer; re-run Step 2 afterwards for the admin.
-- ---------------------------------------------------------------------------

-- insert into public.profiles (id, full_name, role)
-- select u.id,
--        coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
--        'customer'
-- from auth.users u
-- on conflict (id) do nothing;
