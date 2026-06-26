-- Golden Pages vetting & approval.
--
-- Businesses no longer self-signup; the public /get-listed form writes an
-- account-less row (user_id null) with status = 'pending' via a server action
-- using the service-role key. The owner (admin) reviews in /admin/golden-pages
-- and approves/declines. A listing is public only when approved AND published.

create type golden_pages_status as enum ('pending', 'approved', 'declined');

-- A submission is just a row now — it need not belong to an auth user.
alter table public.golden_pages_profiles
  alter column user_id drop not null;

alter table public.golden_pages_profiles
  add column email text,
  add column status golden_pages_status not null default 'pending',
  add column admin_notes text,
  add column decline_reason text,
  add column reviewed_at timestamptz,
  add column reviewed_by uuid references auth.users (id) on delete set null;

-- Existing visible rows predate the vetting flow — treat them as approved.
update public.golden_pages_profiles
  set status = 'approved'
  where is_visible = true;

-- Public read now requires both a publish toggle and an approval.
drop policy if exists "gp: visible are public" on public.golden_pages_profiles;
create policy "gp: approved are public" on public.golden_pages_profiles
  for select to anon, authenticated
  using (is_visible = true and status = 'approved');

-- Note: public submissions are inserted by the service-role key (server action),
-- which bypasses RLS, so there is intentionally no anon INSERT policy. The
-- "gp: admin all" policy from the initial schema still gives the owner full access.
