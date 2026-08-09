-- Whether a tracked document is a first-time application or a renewal of
-- one already held. Applying and renewing are genuinely different real-world
-- processes for most document types, so this decides which playbook variant
-- (application vs renewal steps) is shown for the document.
alter table documents
  add column intent text not null default 'renewal';

alter table documents
  add constraint documents_intent_check check (intent in ('application', 'renewal'));
