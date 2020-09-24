SELECT
  job.*,
  json_agg(jr) jobRequirements
FROM job
JOIN (select * FROM job_requirement) as jr
ON jr.jobId = job.jobId
WHERE job.tenantId = ${tenantId}
  AND (job.jobId = ${jobId} OR ${jobId} IS NULL)
GROUP BY job.jobId
ORDER BY job.created_at DESC;
