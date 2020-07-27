SELECT
  appl.*,
  COUNT(screening.applicant_id)::int::boolean as screening_exists
FROM 
  applicant appl
LEFT JOIN
  (SELECT applicant_id FROM screening WHERE submitter_id = ${user_id}) as screening
ON
  screening.applicant_id = appl.applicant_id
WHERE
  appl.organization_id = ${organization_id}
  AND (appl.job_id = ${job_id} OR ${job_id} IS NULL)
GROUP BY appl.applicant_id
 