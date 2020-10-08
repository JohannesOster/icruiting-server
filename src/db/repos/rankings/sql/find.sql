SELECT
	applicant_id,
	COUNT(DISTINCT submitter_id) AS submissions_count,
	ROUND(STDDEV_POP(single_submission.score), 2) AS standard_deviation,
	ROUND(AVG(single_submission.score), 2) AS score,
  ROW_NUMBER() OVER (ORDER BY AVG(single_submission.score) DESC) AS rank,
	ARRAY_AGG(single_submission.submission) AS submissions
FROM
	(SELECT * FROM form_submission_view
	 WHERE form_category=${form_category}
	   AND tenant_id=${tenant_id}
		 AND job_id=${job_id}) AS single_submission
GROUP BY applicant_id
ORDER BY rank;
