SELECT form.*, json_agg(form_field.* ORDER BY row_index ASC) form_fields
FROM form
JOIN form_field 
ON form_field.form_id = form.form_id
WHERE form.tenant_id = ${tenant_id}
  AND (form.job_id = ${job_id} OR ${job_id} IS NULL)
  AND (form_category = ${form_category} OR ${form_category} IS NULL)
GROUP BY form.form_id
ORDER BY form.form_title;
