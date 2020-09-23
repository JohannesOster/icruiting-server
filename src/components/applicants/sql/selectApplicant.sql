SELECT applicant.*,
       array_agg(json_build_object(
         'key', form_field.label,
         'value', applicant_attribute.attribute_value
        )) FILTER (WHERE form_field.component != 'file_upload') AS attributes,
       array_agg(json_build_object(
         'key', form_field.label,
         'value', applicant_attribute.attribute_value
        )) FILTER (WHERE form_field.component = 'file_upload') AS files
FROM applicant
LEFT JOIN applicant_attribute
ON applicant_attribute.applicant_id = applicant.applicant_id
LEFT JOIN form_field
ON applicant_attribute.form_field_id = form_field.form_field_id
WHERE applicant.tenant_id = ${tenant_id}
  AND (applicant.applicant_id = ${applicant_id} OR ${applicant_id} IS NULL)
GROUP BY applicant.applicant_id
 