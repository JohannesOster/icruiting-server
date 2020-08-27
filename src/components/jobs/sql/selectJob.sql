SELECT
  job.*,
  json_agg(jr) job_requirements
FROM job
JOIN (select * FROM job_requirement) as jr 
ON jr.job_id = job.job_id
WHERE job.organization_id = ${organization_id}
  AND job.job_id = ${job_id}
GROUP BY job.job_id