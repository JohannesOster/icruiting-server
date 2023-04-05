SELECT
  job.*,
  COALESCE(NULLIF(json_agg(jr ORDER BY requirement_label)::TEXT, '[null]'), '[]')::JSON AS job_requirements 
FROM job
LEFT JOIN job_requirement jr
ON jr.job_id = job.job_id
WHERE job.tenant_id = ${tenant_id}
  AND (job.job_id = ${job_id} OR ${job_id} IS NULL)
GROUP BY job.job_id
ORDER BY job.created_at DESC;