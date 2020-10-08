SELECT *
FROM
	(
		SELECT
			applicant_id,
			tenant_id,
			JSON_AGG(JSON_BUILD_OBJECT('job_requirement_label', normalization.requirement_label, 'mean', normalization.mean, 'values', normalization.submission_values)) AS normalization,
			COUNT(DISTINCT submitter_id) AS submissions_count,
			ROUND(STDDEV_POP(single_submission.score), 2) AS standard_deviation,
			ROUND(AVG(single_submission.score), 2) AS score,
			ROW_NUMBER() OVER (ORDER BY AVG(single_submission.score) DESC) AS rank,
			ARRAY_AGG(single_submission.submission) AS submissions
		FROM
			(SELECT job_id FROM applicant WHERE applicant_id = ${applicant_id}) AS applicant
			JOIN (SELECT * FROM form_submission_view WHERE form_category=${form_category} AND tenant_id = ${tenant_id}) AS single_submission
			ON single_submission.job_id = applicant.job_id
			LEFT JOIN (
				SELECT
					job_requirement.job_id,
					requirement_label,
					job_requirement.job_requirement_id,
					array_agg(submission_value) submission_values,
					ROUND(AVG(submission_value::NUMERIC),2) AS mean
				FROM job_requirement
				JOIN form ON form.job_id = job_requirement.job_id
				JOIN form_field ON form_field.form_id = form.form_id AND job_requirement.job_requirement_id = form_field.job_requirement_id
				JOIN form_submission_field ON form_field.form_field_id = form_submission_field.form_field_id
				WHERE form.form_category = ${form_category} 
				GROUP BY job_requirement.job_requirement_id, requirement_label
			) AS normalization
			ON normalization.job_id = applicant.job_id
			GROUP BY applicant_id, tenant_id
			ORDER BY rank) AS complete_ranking
WHERE applicant_id = ${applicant_id}
