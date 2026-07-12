-- Submission hardening: deduplication + per-IP rate limiting for the public
-- /get-listed and /apply forms. All writes still go through the service-role
-- server action; these are backstops/helpers it uses.

-- 1. Race-safe dedup backstop: at most one pending/approved listing per email.
--    (The app also checks phone + business name, which can't be one index.)
create unique index if not exists golden_pages_unique_active_email
  on public.golden_pages_profiles (lower(email))
  where status in ('pending', 'approved');

-- 2. Per-IP rate-limit ledger. Only the service-role key (which bypasses RLS)
--    reads/writes this; RLS is enabled with no policies so no one else can.
create table if not exists public.submission_throttle (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists submission_throttle_ip_time
  on public.submission_throttle (ip_hash, created_at);
alter table public.submission_throttle enable row level security;

-- 3. Dedup check: does a pending/approved listing already match this email,
--    normalized phone (digits only), or business name? SECURITY INVOKER — only
--    the service role (which bypasses RLS) may execute it.
create or replace function public.listing_duplicate_exists(
  p_email text,
  p_phone text,
  p_business_name text
) returns boolean
language sql
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.golden_pages_profiles
    where status in ('pending', 'approved')
      and (
        (p_email is not null and lower(email) = lower(p_email))
        or (p_business_name is not null and lower(business_name) = lower(p_business_name))
        or (
          p_phone is not null and p_phone <> ''
          and regexp_replace(coalesce(phone, ''), '\D', '', 'g') = p_phone
        )
      )
  );
$$;

revoke execute on function public.listing_duplicate_exists(text, text, text) from public;
grant execute on function public.listing_duplicate_exists(text, text, text) to service_role;
