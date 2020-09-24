SELECT job.*, json_agg(jr) jobRequirements
FROM job
JOIN (SELECT * FROM job_requirement) AS jr
ON jr.jobId = job.jobId
WHERE job.tenantId = ${tenantId}
GROUP BY job.jobId
ORDER BY job.created_at DESC;
