SELECT
	applicant_id,
	COUNT(DISTINCT submitter_id) AS submissions_count,
	ROUND(STDDEV_POP(score), 2) AS standard_deviation,
	ROUND(AVG(score), 2) AS score,
  ROW_NUMBER() OVER (ORDER BY AVG(score) DESC) AS rank,
	ARRAY_AGG(submission) AS submissions
FROM form_submission_view
WHERE form_category=${form_category}
	AND tenant_id=${tenant_id}
	AND job_id=${job_id}
GROUP BY applicant_id
ORDER BY rank;
