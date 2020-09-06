SELECT 
	applicant_id,
	COUNT(DISTINCT submitter_id) AS submissions_count,
	STDDEV_POP(single_submission.score) AS standard_deviation,
	SUM(single_submission.score) AS score,
	ARRAY_AGG(single_submission.submission) AS submissions
FROM
	(SELECT
		submitter_id,
		applicant_id,
		SUM(VALUE::NUMERIC) FILTER (WHERE form_item.intent = 'sum_up') AS score,
		JSON_AGG(JSON_BUILD_OBJECT(
			'form_item_id', form_item.form_item_id,
			'label', form_item.label,
			'intent', form_item.intent,
			'value', submission_field.value
		)) AS submission
	FROM form
	JOIN form_item
	ON form_item.form_id = form.form_id
	JOIN 
		(SELECT form_submission.*, KEY::UUID as form_item_id, VALUE FROM form_submission, jsonb_each_text(submission)) AS submission_field
	ON submission_field.form_item_id = form_item.form_item_id
	WHERE form.form_category='assessment'
		AND form.organization_id=${organization_id}
		AND form.job_id=${job_id}
	GROUP BY submitter_id, applicant_id) AS single_submission
GROUP BY applicant_id
ORDER BY score DESC
