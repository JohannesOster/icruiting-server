SELECT *
FROM 
(SELECT 
	applicant_id,
	ROW_NUMBER() OVER (ORDER BY SUM(single_submission.score) DESC) AS rank,
	STDDEV_POP(single_submission.score) AS standard_deviation,
	SUM(single_submission.score) AS score,
	ARRAY_AGG(single_submission.submission) AS submissions
FROM 
	(SELECT
		submitter_id,
		applicant_id,
		SUM(VALUE::NUMERIC) FILTER (WHERE form_field.intent = 'sum_up') AS score,
		JSON_AGG(JSON_BUILD_OBJECT(
			'form_field_id', form_field.form_field_id,
			'job_requirement_label', job_requirement.requirement_label,
			'label', form_field.label,
			'intent', form_field.intent,
			'value', submission_field.value
		)) AS submission
	FROM 
		(SELECT job_id FROM applicant WHERE applicant_id = ${applicant_id}) AS appl
	JOIN form
	ON form.job_id = appl.job_id
	JOIN form_field
	ON form_field.form_id = form.form_id
	JOIN 
		(SELECT form_submission.*, KEY::UUID as form_field_id, VALUE FROM form_submission, jsonb_each_text(submission)) AS submission_field
	ON submission_field.form_field_id = form_field.form_field_id
	LEFT JOIN job_requirement
	ON job_requirement.job_requirement_id = form_field.job_requirement_id
	WHERE form.organization_id = ${organization_id}
	  AND form.form_category = ${form_category}
	GROUP BY submitter_id, applicant_id) AS single_submission
GROUP BY applicant_id
ORDER BY score DESC) foo
WHERE applicant_id = ${applicant_id}