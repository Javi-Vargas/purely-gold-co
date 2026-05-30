-- Purely GOLD Co. — initial schema (Week 1-2 Foundation)
-- All 11 domain tables, enums, signup->profile trigger, and RLS policies.
--
-- Authorization model notes:
--   * The authoritative role lives in auth.users.raw_app_meta_data->>'role'
--     (NOT user_metadata, which is client-editable). It is set server-side by
--     the handle_new_user() trigger and surfaces in the JWT as app_metadata.role.
--   * Self-signup can only ever produce 'client' | 'provider' | 'golden_pages'.
--     'admin' is provisioned manually and can never be self-assigned.
--   * Payments are stubbed this sprint: client / golden_pages profiles are
--     created with subscription_status = 'active' on signup.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type subscription_status as enum ('active', 'inactive', 'cancelled');
create type provider_service_type as enum ('photography', 'videography', 'agency', 'production', 'other');
create type provider_application_status as enum ('pending', 'auto_screened', 'approved', 'declined');
create type order_status as enum ('pending', 'accepted', 'in_progress', 'delivered', 'revision_requested', 'complete', 'cancelled');
create type application_status as enum ('submitted', 'auto_review', 'admin_review', 'approved', 'declined');
create type ai_tool as enum ('brief_builder', 'content_strategy', 'shot_list', 'caption_copy', 'budget_planner', 'mood_board');

-- ---------------------------------------------------------------------------
-- Helper: is the current request an admin? (reads the trustworthy app_metadata)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() #>> '{app_metadata,role}') = 'admin', false);
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.client_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  business_name text,
  contact_name text,
  industry text,
  bio text,
  avatar_url text,
  subscription_status subscription_status not null default 'inactive',
  paypal_customer_id text,
  created_at timestamptz not null default now()
);

create table public.provider_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  business_name text,
  contact_name text,
  service_type provider_service_type,
  location text,
  bio text,
  portfolio_urls text[] not null default '{}',
  listing_fee_paid boolean not null default false,
  application_status provider_application_status not null default 'pending',
  paypal_account_email text,
  created_at timestamptz not null default now()
);

create table public.golden_pages_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  business_name text,
  service_type provider_service_type,
  contact_name text,
  phone text,
  address text,
  city text,
  state text,
  zip text,
  website_url text,
  business_hours text,
  bio text,
  logo_url text,
  subscription_status subscription_status not null default 'inactive',
  paypal_customer_id text,
  is_visible boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.provider_packages (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_profiles (id) on delete cascade,
  title text not null,
  description text,
  price integer not null,          -- cents
  delivery_days integer,
  revisions integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles (id) on delete cascade,
  provider_id uuid not null references public.provider_profiles (id) on delete cascade,
  package_id uuid references public.provider_packages (id) on delete set null,
  title text,
  brief text,
  status order_status not null default 'pending',
  amount_paid integer,             -- cents
  paypal_order_id text,
  deadline date,
  delivered_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.revisions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  requested_by uuid references auth.users (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  sender_id uuid references auth.users (id) on delete set null,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Provider application can be submitted publicly (before an account exists),
-- so user_id is nullable.
create table public.provider_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  business_name text,
  service_type text,
  location text,
  website_url text,
  portfolio_url text,
  instagram_url text,
  years_experience integer,
  description text,
  auto_screen_score integer,
  auto_screen_flags text[] not null default '{}',
  admin_notes text,
  status application_status not null default 'submitted',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  client_id uuid not null references public.client_profiles (id) on delete cascade,
  provider_id uuid not null references public.provider_profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table public.tool_outputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tool ai_tool not null,
  title text,
  input_params jsonb,
  output_content text,
  is_saved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Signup -> profile trigger
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
begin
  requested_role := coalesce(new.raw_user_meta_data ->> 'role', 'client');
  -- self-signup can never grant admin
  if requested_role not in ('client', 'provider', 'golden_pages') then
    requested_role := 'client';
  end if;

  -- promote the role into app_metadata so it is trustworthy for authorization
  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
                             || jsonb_build_object('role', requested_role)
   where id = new.id;

  if requested_role = 'client' then
    insert into public.client_profiles (user_id, business_name, contact_name, subscription_status)
    values (new.id, new.raw_user_meta_data ->> 'business_name',
            new.raw_user_meta_data ->> 'contact_name', 'active');  -- payments stubbed
  elsif requested_role = 'provider' then
    insert into public.provider_profiles (user_id, business_name, contact_name)
    values (new.id, new.raw_user_meta_data ->> 'business_name',
            new.raw_user_meta_data ->> 'contact_name');
  elsif requested_role = 'golden_pages' then
    insert into public.golden_pages_profiles (user_id, business_name, contact_name, subscription_status)
    values (new.id, new.raw_user_meta_data ->> 'business_name',
            new.raw_user_meta_data ->> 'contact_name', 'active');  -- payments stubbed
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.client_profiles        enable row level security;
alter table public.provider_profiles      enable row level security;
alter table public.golden_pages_profiles  enable row level security;
alter table public.provider_packages      enable row level security;
alter table public.orders                 enable row level security;
alter table public.revisions              enable row level security;
alter table public.messages               enable row level security;
alter table public.provider_applications  enable row level security;
alter table public.reviews                enable row level security;
alter table public.tool_outputs           enable row level security;

-- client_profiles ----------------------------------------------------------
create policy "client: read own" on public.client_profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "client: update own" on public.client_profiles
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "client: insert own" on public.client_profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "client: admin reads all" on public.client_profiles
  for select to authenticated using (public.is_admin());

-- provider_profiles ---------------------------------------------------------
create policy "provider: approved are readable" on public.provider_profiles
  for select to authenticated
  using (application_status = 'approved' and listing_fee_paid = true);
create policy "provider: read own" on public.provider_profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "provider: update own" on public.provider_profiles
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "provider: insert own" on public.provider_profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "provider: admin all" on public.provider_profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- golden_pages_profiles -----------------------------------------------------
create policy "gp: visible are public" on public.golden_pages_profiles
  for select to anon, authenticated using (is_visible = true);
create policy "gp: read own" on public.golden_pages_profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "gp: update own" on public.golden_pages_profiles
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "gp: insert own" on public.golden_pages_profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "gp: admin all" on public.golden_pages_profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- provider_packages ---------------------------------------------------------
create policy "pkg: active of approved providers readable" on public.provider_packages
  for select to authenticated
  using (
    is_active and exists (
      select 1 from public.provider_profiles p
      where p.id = provider_id
        and p.application_status = 'approved'
        and p.listing_fee_paid = true
    )
  );
create policy "pkg: provider manages own" on public.provider_packages
  for all to authenticated
  using (exists (select 1 from public.provider_profiles p
                 where p.id = provider_id and p.user_id = (select auth.uid())))
  with check (exists (select 1 from public.provider_profiles p
                      where p.id = provider_id and p.user_id = (select auth.uid())));
create policy "pkg: admin all" on public.provider_packages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- orders --------------------------------------------------------------------
create policy "order: client reads own" on public.orders
  for select to authenticated
  using (exists (select 1 from public.client_profiles c
                 where c.id = client_id and c.user_id = (select auth.uid())));
create policy "order: provider reads own" on public.orders
  for select to authenticated
  using (exists (select 1 from public.provider_profiles p
                 where p.id = provider_id and p.user_id = (select auth.uid())));
create policy "order: client creates" on public.orders
  for insert to authenticated
  with check (exists (select 1 from public.client_profiles c
                      where c.id = client_id and c.user_id = (select auth.uid())));
create policy "order: client updates own" on public.orders
  for update to authenticated
  using (exists (select 1 from public.client_profiles c
                 where c.id = client_id and c.user_id = (select auth.uid())))
  with check (exists (select 1 from public.client_profiles c
                      where c.id = client_id and c.user_id = (select auth.uid())));
create policy "order: provider updates own" on public.orders
  for update to authenticated
  using (exists (select 1 from public.provider_profiles p
                 where p.id = provider_id and p.user_id = (select auth.uid())))
  with check (exists (select 1 from public.provider_profiles p
                      where p.id = provider_id and p.user_id = (select auth.uid())));
create policy "order: admin all" on public.orders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- messages ------------------------------------------------------------------
create policy "msg: participants read" on public.messages
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    left join public.client_profiles c on c.id = o.client_id
    left join public.provider_profiles p on p.id = o.provider_id
    where o.id = order_id
      and ((select auth.uid()) in (c.user_id, p.user_id))
  ));
create policy "msg: participant sends" on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.orders o
      left join public.client_profiles c on c.id = o.client_id
      left join public.provider_profiles p on p.id = o.provider_id
      where o.id = order_id
        and ((select auth.uid()) in (c.user_id, p.user_id))
    )
  );
create policy "msg: recipient marks read" on public.messages
  for update to authenticated
  using (exists (
    select 1 from public.orders o
    left join public.client_profiles c on c.id = o.client_id
    left join public.provider_profiles p on p.id = o.provider_id
    where o.id = order_id and ((select auth.uid()) in (c.user_id, p.user_id))
  ))
  with check (exists (
    select 1 from public.orders o
    left join public.client_profiles c on c.id = o.client_id
    left join public.provider_profiles p on p.id = o.provider_id
    where o.id = order_id and ((select auth.uid()) in (c.user_id, p.user_id))
  ));

-- revisions -----------------------------------------------------------------
create policy "rev: participants read" on public.revisions
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    left join public.client_profiles c on c.id = o.client_id
    left join public.provider_profiles p on p.id = o.provider_id
    where o.id = order_id and ((select auth.uid()) in (c.user_id, p.user_id))
  ));
create policy "rev: participant creates" on public.revisions
  for insert to authenticated
  with check (
    requested_by = (select auth.uid())
    and exists (
      select 1 from public.orders o
      left join public.client_profiles c on c.id = o.client_id
      left join public.provider_profiles p on p.id = o.provider_id
      where o.id = order_id and ((select auth.uid()) in (c.user_id, p.user_id))
    )
  );

-- provider_applications -----------------------------------------------------
-- The /apply form is public (no account yet), so anon may insert. Submissions
-- always start as 'submitted' (no self-approval) and an authenticated user can
-- only file under their own id; anonymous submissions have a null user_id.
create policy "app: public submit" on public.provider_applications
  for insert to anon, authenticated
  with check (
    status = 'submitted'
    and (user_id is null or user_id = (select auth.uid()))
  );
create policy "app: read own" on public.provider_applications
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "app: admin reads all" on public.provider_applications
  for select to authenticated using (public.is_admin());
create policy "app: admin updates" on public.provider_applications
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- reviews -------------------------------------------------------------------
create policy "review: readable by authenticated" on public.reviews
  for select to authenticated using (true);
create policy "review: client creates for own order" on public.reviews
  for insert to authenticated
  with check (exists (select 1 from public.client_profiles c
                      where c.id = client_id and c.user_id = (select auth.uid())));

-- tool_outputs --------------------------------------------------------------
create policy "tool: owner all" on public.tool_outputs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
