-- Some tracked documents genuinely have no expiry (a PSA birth certificate,
-- a permanent SSS/TIN number) — forcing a fake date onto them just to
-- satisfy a NOT NULL constraint would be misleading. expiry_date now
-- allows null; application-intent placeholders (see
-- placeholderExpiryForApplication in Dashboard.jsx) are unaffected, and a
-- null expiry_date is treated as its own "no_expiry" urgency state in the
-- client rather than ever being read as an actual date.
alter table documents alter column expiry_date drop not null;
