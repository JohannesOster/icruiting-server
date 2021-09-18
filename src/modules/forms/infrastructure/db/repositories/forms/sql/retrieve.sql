SELECT form.*, json_agg(form_field.* ORDER BY row_index ASC) FILTER (WHERE form_field.form_field_id IS NOT NULL) AS form_fields
FROM form
LEFT JOIN form_field
ON form_field.form_id = form.form_id OR form_field.form_id = form.replica_of
WHERE form.form_id = ${form_id}
  AND (form.tenant_id = ${tenant_id} OR ${tenant_id} Is NULL)
GROUP BY form.form_id;