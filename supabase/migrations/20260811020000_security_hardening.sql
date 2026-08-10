-- Note: the security advisor also flags the pg_net extension as living in
-- the public schema (best practice is a dedicated extensions schema). It
-- doesn't support ALTER EXTENSION ... SET SCHEMA, and moving it requires a
-- drop/recreate that risks disrupting the send-reminders cron job's
-- net.http_post call — left as-is since this is a low-severity hygiene
-- finding, not an active vulnerability in this app.

-- Backs the send-password-reset edge function's per-email rate limit. No
-- RLS policies on purpose (same pattern as reminder_log/site_visits) —
-- this table is never read or written by anything except that function's
-- service-role key, so RLS-enabled-with-no-policies (default deny for
-- anon/authenticated) is the correct, safest configuration.
create table if not exists public.password_reset_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  requested_at timestamptz not null default now()
);

alter table public.password_reset_attempts enable row level security;

create index if not exists password_reset_attempts_email_requested_at_idx
  on public.password_reset_attempts (email, requested_at);
