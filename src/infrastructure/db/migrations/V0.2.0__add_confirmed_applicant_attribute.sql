ALTER TABLE applicant 
ADD COLUMN IF NOT EXISTS confirmed  BOOLEAN NOT NULL DEFAULT FALSE;

DROP VIEW applicant_view;
CREATE OR REPLACE VIEW applicant_view AS
SELECT applicant.*,
  array_agg(json_build_object(
    'form_field_id', form_field.form_field_id,
    'value', applicant_attribute.attribute_value
    ) ORDER BY form_field.row_index) FILTER (WHERE form_field.component != 'file_upload') AS attributes,
  array_agg(json_build_object(
    'form_field_id', form_field.form_field_id,
    'uri', applicant_attribute.attribute_value
    ) ORDER BY form_field.row_index) FILTER (WHERE form_field.component = 'file_upload') AS files
FROM applicant
LEFT JOIN applicant_attribute
ON applicant_attribute.applicant_id = applicant.applicant_id
LEFT JOIN form_field
ON applicant_attribute.form_field_id = form_field.form_field_id
GROUP BY applicant.applicant_id;
