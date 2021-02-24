SELECT 
  report_field.tenant_id,
  report_field.job_id,
  array_agg(report_field.form_field_id) as form_fields
FROM report_field
WHERE tenant_id=${tenant_id} AND job_id=${job_id}
GROUP BY tenant_id, job_id;
