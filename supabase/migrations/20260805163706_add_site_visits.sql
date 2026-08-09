-- Tracks whether a visitor's IP has been seen before, so the landing page
-- can decide whether to lead with signup (first time) or a login screen
-- with their email remembered (returning). Only the hash of the IP is
-- stored, never the raw address, and only the check-visit edge function
-- (using the service role key) can read or write this table, RLS with no
-- policies blocks every other client entirely, including anon.
create table site_visits (
  ip_hash text primary key,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

alter table site_visits enable row level security;
