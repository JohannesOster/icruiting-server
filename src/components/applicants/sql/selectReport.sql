SELECT *
FROM
	(
		SELECT
			applicant_id,
			tenant_id,
			COUNT(DISTINCT submitter_id) AS submissions_count,
			ROUND(STDDEV_POP(single_submission.score), 2) AS standard_deviation,
			ROUND(AVG(single_submission.score), 2) AS score,
			ROW_NUMBER() OVER (ORDER BY AVG(single_submission.score) DESC) AS rank,
			ARRAY_AGG(single_submission.submission) AS submissions
		FROM
			(SELECT job_id FROM applicant WHERE applicant_id = ${applicant_id}) AS applicant
			JOIN (SELECT * FROM form_submission_view WHERE form_category = ${form_category} AND tenant_id = ${tenant_id}) AS single_submission
			ON single_submission.job_id = applicant.job_id
		GROUP BY applicant_id, tenant_id
		ORDER BY rank) AS complete_ranking
WHERE applicant_id = ${applicant_id};

