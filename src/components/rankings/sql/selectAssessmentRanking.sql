SELECT
	applicantId,
	COUNT(DISTINCT submitterId) AS submissions_count,
	ROUND(STDDEV_POP(single_submission.score), 2) AS standardDeviation,
	ROUND(AVG(single_submission.score), 2) AS score,
  ROW_NUMBER() OVER (ORDER BY AVG(single_submission.score) DESC) AS rank,
	ARRAY_AGG(single_submission.submission) AS submissions
FROM
	(SELECT
		submitterId,
		applicantId,
		SUM(submission_value::NUMERIC) FILTER (WHERE form_field.intent = 'sum_up') AS score,
		JSON_AGG(JSON_BUILD_OBJECT(
			'formFieldId', form_field.formFieldId,
			'label', form_field.label,
			'intent', form_field.intent,
			'value', submission_value
		)) AS submission
	FROM form
	JOIN form_field
	ON form_field.formId = form.formId
	JOIN
		(SELECT form_submission.*, formFieldId, submission_value
			FROM form_submission
			JOIN form_submission_field
			ON form_submission.formSubmissionId = form_submission_field.formSubmissionId) AS submission_field
	ON submission_field.formFieldId = form_field.formFieldId
	WHERE form.formCategory='assessment'
		AND form.tenantId=${tenantId}
		AND form.jobId=${jobId}
	GROUP BY submitterId, applicantId) AS single_submission
GROUP BY applicantId
ORDER BY rank;
