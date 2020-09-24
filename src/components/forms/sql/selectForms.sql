SELECT form.*, json_agg(items.* ORDER BY row_index ASC) form_fields
FROM form
JOIN (SELECT * FROM form_field) as items
ON items.form_id = form.formId
WHERE form.tenant_id = ${tenantId}
  AND (form.job_id = ${jobId} OR ${jobId} IS NULL)
GROUP BY form.form_id;
