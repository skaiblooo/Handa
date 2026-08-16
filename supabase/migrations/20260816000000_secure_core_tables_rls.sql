-- Defensive RLS hardening for the core user-data tables. documents,
-- playbook_feedback, and reminder_log predate migration tracking (they
-- were created directly in the Supabase dashboard), so their policy
-- history isn't visible from this repo and can't be inspected locally
-- either (supabase db dump/pull require Docker, which isn't available
-- here). Rather than guess their current state, this migration is
-- written to force a known-correct end state from any starting state:
-- it drops every existing policy on these three tables by name (via
-- pg_policies, not just names this file happens to know about) before
-- recreating exactly the policies below. That also protects against a
-- stray permissive policy from manual dashboard edits coexisting with
-- a stricter one added here — Postgres ORs permissive policies
-- together, so a leftover "allow all" would otherwise still win.
do $$
declare
  pol record;
begin
  for pol in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('documents', 'playbook_feedback', 'reminder_log')
  loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

-- documents holds sensitive PII (NBI clearance numbers, addresses,
-- license numbers, etc. via card_fields). The client (Dashboard.jsx
-- fetchDocuments) selects with no .eq('user_id', ...) filter at all —
-- it relies entirely on RLS to scope rows to the signed-in user.
-- Without a correct policy here, any authenticated user could read,
-- edit, or delete every other user's documents.
alter table public.documents enable row level security;

create policy "documents_select_own"
  on public.documents for select
  to authenticated
  using (user_id = auth.uid());

create policy "documents_insert_own"
  on public.documents for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "documents_update_own"
  on public.documents for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "documents_delete_own"
  on public.documents for delete
  to authenticated
  using (user_id = auth.uid());

-- playbook_feedback: the client only ever inserts (PlaybookModal.jsx
-- submitFeedback), scoped to its own user_id, and nothing reads it
-- back client-side — there's no in-app view of aggregate feedback.
-- Insert-only, own-rows-only is therefore the correct minimal policy;
-- select/update/delete stay default-denied for anon/authenticated,
-- same as the tables below (a service-role job, if ever added for
-- admin analytics, bypasses RLS same as the edge functions do).
alter table public.playbook_feedback enable row level security;

create policy "playbook_feedback_insert_own"
  on public.playbook_feedback for insert
  to authenticated
  with check (user_id = auth.uid());

-- reminder_log is only ever touched by the send-reminders edge
-- function via its service-role key (no src/*.jsx reference exists at
-- all), so it follows the same pattern already established for
-- site_visits / password_reset_attempts / news_cache: RLS enabled,
-- zero policies. Default-deny for anon/authenticated; service role
-- bypasses RLS entirely.
alter table public.reminder_log enable row level security;
