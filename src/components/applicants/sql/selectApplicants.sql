SELECT applicant.*,
       COUNT(screening.applicant_id)::int::boolean as screening_exists
FROM applicant
LEFT JOIN
  (SELECT applicant_id
   FROM form_submission
   LEFT JOIN form
   ON form_submission.form_id = form.form_id
   WHERE form.tenant_id = ${tenant_id} 
     AND form.form_category = 'screening'
     AND form_submission.submitter_id = ${user_id} 
  ) as screening
ON screening.applicant_id = applicant.applicant_id
CROSS JOIN jsonb_array_elements(applicant.attributes)
WHERE applicant.tenant_id = ${tenant_id}
  AND (applicant.job_id = ${job_id} OR ${job_id} IS NULL)
  AND value->>'key'='Vollständiger Name'
GROUP BY applicant.applicant_id, value
ORDER BY value->>'value';
