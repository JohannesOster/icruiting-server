select job.*, json_agg(jr) job_requirements
from job
join (select * from job_requirement) as jr 
on jr.job_id = job.job_id
where job.tenant_id = ${tenant_id}
  and job.job_id = ${job_id}
group by job.job_id