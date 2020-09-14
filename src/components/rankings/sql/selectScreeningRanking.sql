SELECT
	applicant_id,
	STDDEV_POP(single_submission.score) AS standard_deviation,
	AVG(single_submission.score) AS score,
  ROW_NUMBER() OVER (ORDER BY AVG(single_submission.score) DESC) AS rank,
	ARRAY_AGG(single_submission.submission) AS submissions
FROM
	(SELECT
		submitter_id,
		applicant_id,
		SUM(VALUE::NUMERIC) FILTER (WHERE form_field.intent = 'sum_up') AS score,
		JSON_AGG(JSON_BUILD_OBJECT(
			'form_field_id', form_field.form_field_id,
			'label', form_field.label,
			'intent', form_field.intent,
			'value', submission_field.value
		)) AS submission
	FROM form
	JOIN form_field
	ON form_field.form_id = form.form_id
	JOIN
		(SELECT form_submission.*, KEY::UUID as form_field_id, VALUE FROM form_submission, jsonb_each_text(submission)) AS submission_field
	ON submission_field.form_field_id = form_field.form_field_id
	WHERE form.form_category='screening'
		AND form.organization_id=${organization_id}
		AND form.job_id=${job_id}
	GROUP BY submitter_id, applicant_id) AS single_submission
GROUP BY applicant_id,
ORDER BY rank ASC
