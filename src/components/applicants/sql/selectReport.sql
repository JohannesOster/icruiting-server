SELECT *
FROM
	(
		SELECT
			applicant_id,
			JSON_AGG(JSON_BUILD_OBJECT('job_requirement_label', normalization.requirement_label, 'mean', normalization.mean, 'values', normalization.submission_values)) AS normalization,
			COUNT(DISTINCT submitter_id) AS submissions_count,
			ROUND(STDDEV_POP(single_submission.score), 2) AS standard_deviation,
			ROUND(AVG(single_submission.score), 2) AS score,
			ROW_NUMBER() OVER (ORDER BY AVG(single_submission.score) DESC) AS rank,
			ARRAY_AGG(single_submission.submission) AS submissions
		FROM
			(
				SELECT
					submitter_id,
					applicant_id,
					SUM(submission_value::NUMERIC) FILTER (WHERE form_field.intent = 'sum_up') AS score,
					JSON_AGG(JSON_BUILD_OBJECT(
						'form_field_id', form_field.form_field_id,
						'job_requirement_label', job_requirement.requirement_label,
						'label', form_field.label,
						'intent', form_field.intent,
						'value', submission_value
					)) AS submission
				FROM
				(SELECT job_id FROM applicant WHERE applicant_id = ${applicant_id}) AS appl
				JOIN form ON form.job_id = appl.job_id
				JOIN form_field ON form_field.form_id = form.form_id
				JOIN
					(SELECT form_submission.*, form_field_id, submission_value
						FROM form_submission
						JOIN form_submission_field
						ON form_submission.form_submission_id = form_submission_field.form_submission_id) AS submission_field
				ON submission_field.form_field_id = form_field.form_field_id
				LEFT JOIN job_requirement
				ON job_requirement.job_requirement_id = form_field.job_requirement_id
				WHERE form.tenant_id = ${tenant_id}
					AND form.form_category = ${form_category}
				GROUP BY submitter_id, applicant_id
		) AS single_submission
	LEFT JOIN
		(
			SELECT requirement_label, job_requirement.job_requirement_id, array_agg(submission_value) submission_values, ROUND(AVG(submission_value::NUMERIC),2) AS mean FROM 
			(SELECT job_id FROM applicant WHERE applicant_id = ${applicant_id}) AS appl
			JOIN job_requirement ON job_requirement.job_id = appl.job_id
			JOIN form ON form.job_id = appl.job_id
			JOIN form_field ON form_field.form_id = form.form_id AND job_requirement.job_requirement_id = form_field.job_requirement_id
			JOIN form_submission_field ON form_field.form_field_id = form_submission_field.form_field_id
			WHERE form.form_category = ${form_category}
			GROUP BY appl.job_id, job_requirement.job_requirement_id, requirement_label
		) AS normalization
	ON 1=1
	GROUP BY applicant_id
	ORDER BY rank
) AS complete_ranking
WHERE applicant_id = ${applicant_id}
