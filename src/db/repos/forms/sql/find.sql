SELECT form.*, json_agg(form_field.* ORDER BY row_index ASC) form_fields
FROM form
JOIN form_field
ON form_field.form_id = form.form_id
WHERE form.form_id = ${form_id}
  AND (form.tenant_id = ${tenant_id} OR ${tenant_id} Is NULL)
GROUP BY form.form_id;