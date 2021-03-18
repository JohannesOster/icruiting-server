DROP VIEW applicant_view;

ALTER TABLE form_field
  DROP CONSTRAINT options_conditional_not_null,
  DROP CONSTRAINT section_header_no_intent,
  ALTER COLUMN component TYPE TEXT;

DROP TYPE form_field_component;
