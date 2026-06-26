-- Foundation fix: the initial schema enabled RLS and wrote policies, but never
-- granted table privileges to the Supabase API roles (anon / authenticated /
-- service_role). RLS only filters *rows* once a role already has table access —
-- without these grants the REST API returns "42501 permission denied" for every
-- request (e.g. the public /golden-pages directory silently returned nothing).
--
-- This grants the standard privileges and relies on RLS (already enabled on every
-- public table) as the row-level boundary, mirroring Supabase's own defaults.

grant usage on schema public to anon, authenticated, service_role;

-- anon: read-only (RLS restricts to publicly-readable rows). No writes — the public
-- "Get Listed" submission is inserted by the service-role key on the server.
grant select on all tables in schema public to anon;

-- authenticated: full DML (RLS restricts to the caller's own rows / admin).
grant select, insert, update, delete on all tables in schema public to authenticated;

-- service_role: full access (bypasses RLS; used only in trusted server code).
grant all on all tables in schema public to service_role;

-- Same defaults for any tables created later, so this bug can't silently recur.
alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant all on tables to service_role;
