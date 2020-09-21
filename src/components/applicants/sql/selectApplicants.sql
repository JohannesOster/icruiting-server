SELECT applicant.*,
       array_agg(json_build_object(
         'key', form_field.label,
         'value', applicant_attribute.attribute_value
        )) FILTER (WHERE form_field.component != 'file_upload') AS attributes,
       array_agg(json_build_object(
         'key', form_field.label,
         'value', applicant_attribute.attribute_value
        )) FILTER (WHERE form_field.component = 'file_upload') AS files,
       COUNT(screening.applicant_id)::int::boolean as screening_exists
FROM applicant
LEFT JOIN applicant_attribute
ON applicant_attribute.applicant_id = applicant.applicant_id
LEFT JOIN form_field
ON applicant_attribute.form_field_id = form_field.form_field_id
LEFT JOIN
  (SELECT applicant_id
   FROM form_submission
   LEFT JOIN form
   ON form_submission.form_id = form.form_id
   WHERE form.tenant_id = ${tenant_id} 
     AND form.form_category = 'screening'
     AND form_submission.submitter_id = ${user_id} 
  ) as screening
ON screening.applicant_id = applicant.applicant_id
WHERE applicant.tenant_id = ${tenant_id}
  AND (applicant.job_id = ${job_id} OR ${job_id} IS NULL)
  AND (applicant.applicant_id = ${applicant_id} OR ${applicant_id} IS NULL)
GROUP BY applicant.applicant_id
 