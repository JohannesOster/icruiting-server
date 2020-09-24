select job.*, json_agg(jr) jobRequirements
from job
join (select * from job_requirement) as jr
on jr.jobId = job.jobId
where job.tenantId = ${tenantId}
  and job.jobId = ${jobId}
group by job.jobId
