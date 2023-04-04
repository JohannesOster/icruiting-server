-- liquibase formatted sql
-- changeset johannesoster:2
BEGIN;
ALTER TABLE form_field DROP CONSTRAINT form_id_row_index_unique;
ALTER TABLE form_field ADD CONSTRAINT form_id_row_index_unique UNIQUE (form_id, row_index) DEFERRABLE;
COMMIT;
