SELECT job.*, json_agg(jr) job_requirements
FROM job
JOIN (SELECT * FROM job_requirement) AS jr 
ON jr.job_id = job.job_id
WHERE job.tenant_id = ${tenant_id}
GROUP BY job.job_id
ORDER BY job.created_at DESC;