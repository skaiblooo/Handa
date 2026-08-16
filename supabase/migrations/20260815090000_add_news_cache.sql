-- Backs the get-agency-news edge function's shared cache. Every My Space
-- news panel (across every user) polls the same edge function; without a
-- shared cache that would call out to GNews once per user per poll instead
-- of once total, blowing through the free tier's 100-requests/day quota
-- almost immediately. No RLS policies on purpose (same pattern as
-- password_reset_attempts/site_visits) — only the edge function's
-- service-role key ever touches this table.
create table if not exists public.news_cache (
  query_key text primary key,
  articles jsonb not null default '[]'::jsonb,
  fetched_at timestamptz not null default now()
);

alter table public.news_cache enable row level security;
