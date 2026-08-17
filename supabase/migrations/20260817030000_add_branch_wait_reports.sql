-- Crowdsourced "how busy is this agency right now" — agency-level rather
-- than a specific branch (no branch directory exists to pick one from,
-- and building one is a separate content task), reported from
-- PlaybookModal at the moment someone's actually about to go deal with
-- that agency. Unlike every other table this week, this is deliberately
-- readable by any signed-in user, not just its own rows — the entire
-- point of crowdsourcing is that your report helps someone else, not
-- just yourself.
create table if not exists public.branch_wait_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  agency_code text not null,
  wait_minutes integer not null check (wait_minutes >= 0 and wait_minutes <= 600),
  reported_at timestamptz not null default now()
);

create index if not exists branch_wait_reports_agency_idx on public.branch_wait_reports (agency_code, reported_at desc);

alter table public.branch_wait_reports enable row level security;

drop policy if exists "branch_wait_reports_select_all" on public.branch_wait_reports;
create policy "branch_wait_reports_select_all"
  on public.branch_wait_reports for select
  to authenticated
  using (true);

drop policy if exists "branch_wait_reports_insert_own" on public.branch_wait_reports;
create policy "branch_wait_reports_insert_own"
  on public.branch_wait_reports for insert
  to authenticated
  with check (user_id = auth.uid());

-- No update/delete policies — a report is a one-off submission, not
-- something the reporter comes back to edit, so there's nothing to allow.
