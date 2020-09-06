SELECT
  job.*,
  json_agg(jr) job_requirements
FROM job
JOIN (select * FROM job_requirement) as jr 
ON jr.job_id = job.job_id
WHERE job.organization_id = ${organization_id}
GROUP BY job.job_id
ORDER BY job.created_at DESC;