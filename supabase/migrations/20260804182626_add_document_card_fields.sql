-- Stores the mock-ID-card detail fields the user fills in per document type
-- (name, DOB, address, license/PIN numbers, etc). Optional and freeform
-- per doc_type, so a single jsonb column instead of a fixed set of columns.
alter table documents
  add column card_fields jsonb null default null;
