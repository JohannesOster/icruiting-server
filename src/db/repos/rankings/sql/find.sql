SELECT
	applicant_id,
	COUNT(DISTINCT submitter_id) AS submissions_count,
	ROUND(STDDEV_POP(single_submission.score), 2) AS standard_deviation,
	ROUND(AVG(single_submission.score), 2) AS score,
  ROW_NUMBER() OVER (ORDER BY AVG(single_submission.score) DESC) AS rank,
	ARRAY_AGG(single_submission.submission) AS submissions
FROM
	(SELECT
		submitter_id,
		applicant_id,
		SUM(submission_value::NUMERIC) FILTER (WHERE form_field.intent = 'sum_up') AS score,
		JSON_AGG(JSON_BUILD_OBJECT(
			'form_field_id', form_field.form_field_id,
			'label', form_field.label,
			'intent', form_field.intent,
			'value', submission_value
		)) AS submission
	FROM form
	JOIN form_field
	ON form_field.form_id = form.form_id
	JOIN
		(SELECT form_submission.*, form_field_id, submission_value
			FROM form_submission
			JOIN form_submission_field
			ON form_submission.form_submission_id = form_submission_field.form_submission_id) AS submission_field
	ON submission_field.form_field_id = form_field.form_field_id
	WHERE form.form_category=${form_category}
		AND form.tenant_id=${tenant_id}
		AND form.job_id=${job_id}
	GROUP BY submitter_id, applicant_id) AS single_submission
GROUP BY applicant_id
ORDER BY rank;