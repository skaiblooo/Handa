-- Lets one account track documents for other people (a spouse, a kid, a
-- parent) without those people needing their own login — household
-- members are just profiles the account holder manages, not separate
-- auth users, so this stays a single-owner table with the same
-- user_id = auth.uid() pattern as everything else. documents.household_
-- member_id points at who a given document actually belongs to; null
-- means it's the account holder's own.
create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  relationship text,
  color integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists household_members_user_id_idx on public.household_members (user_id);

alter table public.household_members enable row level security;

drop policy if exists "household_members_select_own" on public.household_members;
create policy "household_members_select_own"
  on public.household_members for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "household_members_insert_own" on public.household_members;
create policy "household_members_insert_own"
  on public.household_members for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "household_members_update_own" on public.household_members;
create policy "household_members_update_own"
  on public.household_members for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "household_members_delete_own" on public.household_members;
create policy "household_members_delete_own"
  on public.household_members for delete
  to authenticated
  using (user_id = auth.uid());

-- Deleting a member un-assigns their documents rather than deleting them —
-- losing track of a document because you renamed/removed a household
-- profile would be a much worse outcome than it just falling back to
-- "unassigned".
alter table public.documents
  add column if not exists household_member_id uuid references public.household_members(id) on delete set null;
