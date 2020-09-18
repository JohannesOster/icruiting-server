SELECT form.*, json_agg(items.* ORDER BY row_index ASC) form_fields
FROM form
JOIN (SELECT * FROM form_field) as items
ON items.form_id = form.form_id
WHERE form.tenant_id = ${tenant_id}
  AND (form.job_id = ${job_id} OR ${job_id} IS NULL)
GROUP BY form.form_id
ORDER BY form.form_title;
