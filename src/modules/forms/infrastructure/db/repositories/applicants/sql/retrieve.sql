SELECT
  tenant_id,
  job_id,
  applicant_id,
  files,
  attributes
FROM applicant_view
WHERE tenant_id = ${tenant_id}
  AND applicant_id = ${applicant_id};
