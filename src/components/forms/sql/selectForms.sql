SELECT form.*, json_agg(items.* ORDER BY rowIndex ASC) formFields
FROM form
JOIN (SELECT * FROM form_field) as items
ON items.formId = form.formId
WHERE form.tenantId = ${tenantId}
  AND (form.jobId = ${jobId} OR ${jobId} IS NULL)
GROUP BY form.formId;
