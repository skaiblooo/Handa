-- Deleting a document currently fails with a foreign key violation because
-- reminder_log rows still reference it. Reminder log entries have no value
-- once their document is gone, so cascade the delete.
alter table reminder_log
  drop constraint reminder_log_document_id_fkey;

alter table reminder_log
  add constraint reminder_log_document_id_fkey
  foreign key (document_id) references documents(id) on delete cascade;
