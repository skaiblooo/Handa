-- Email alerts / weekly digest toggles in Settings only ever wrote to
-- localStorage, so send-reminders and send-monthly-digest had no way to
-- honor them and emailed every user regardless of what they'd chosen.
-- This table is the server-side home for those two preferences (push
-- already has a real source of truth: the presence of a push_subscriptions
-- row, so it isn't duplicated here). Absence of a row means "defaults" —
-- both true — matching the client's existing default so a user who never
-- opens Settings keeps getting reminders exactly as before.
create table notification_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_alerts boolean not null default true,
  weekly_digest boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table notification_prefs enable row level security;

create policy "select own notification prefs"
  on notification_prefs for select
  using (user_id = auth.uid());

create policy "insert own notification prefs"
  on notification_prefs for insert
  with check (user_id = auth.uid());

create policy "update own notification prefs"
  on notification_prefs for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
