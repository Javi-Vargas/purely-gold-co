-- Simplify the schema to the Golden Pages directory only.
--
-- The product is now just: a public business directory + an account-less
-- "get listed" submission that the owner vets in /admin. The original
-- two-layer marketplace (clients, providers, orders, packages, messages,
-- reviews, AI tool outputs) is gone, so its tables/enums/trigger are removed.
-- The only table that holds data is golden_pages_profiles.

-- 1. The signup trigger inserts into tables we're dropping and is obsolete —
--    there is no self-signup; admins are provisioned manually. Remove it.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 2. Drop the unused marketplace tables (cascade removes their policies + FKs).
drop table if exists public.revisions cascade;
drop table if exists public.reviews cascade;
drop table if exists public.messages cascade;
drop table if exists public.orders cascade;
drop table if exists public.provider_packages cascade;
drop table if exists public.tool_outputs cascade;
drop table if exists public.provider_applications cascade;
drop table if exists public.provider_profiles cascade;
drop table if exists public.client_profiles cascade;

-- 3. Trim dead columns + obsolete owner policies on golden_pages_profiles.
--    Listings are account-less submissions now (no user_id, no subscription).
drop policy if exists "gp: read own" on public.golden_pages_profiles;
drop policy if exists "gp: insert own" on public.golden_pages_profiles;
drop policy if exists "gp: update own" on public.golden_pages_profiles;

alter table public.golden_pages_profiles
  drop column if exists user_id,
  drop column if exists subscription_status,
  drop column if exists paypal_customer_id,
  drop column if exists logo_url,
  drop column if exists address,
  drop column if exists zip;

-- 4. Drop enums no longer referenced by any column.
--    (provider_service_type and golden_pages_status are still in use.)
drop type if exists application_status;
drop type if exists order_status;
drop type if exists provider_application_status;
drop type if exists ai_tool;
drop type if exists subscription_status;
