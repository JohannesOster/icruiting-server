SELECT *
FROM
(SELECT
	applicantId,
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
			'jobRequirementLabel', job_requirement.requirementLabel,
			'label', form_field.label,
			'intent', form_field.intent,
			'value', submission_value
		)) AS submission
	FROM
		(SELECT jobId FROM applicant WHERE applicantId = ${applicantId}) AS appl
	JOIN form
	ON form.jobId = appl.jobId
	JOIN form_field
	ON form_field.formId = form.formId
	JOIN
		(SELECT form_submission.*, formFieldId, submission_value
			FROM form_submission
			JOIN form_submission_field
			ON form_submission.formSubmissionId = form_submission_field.formSubmissionId) AS submission_field
	ON submission_field.formFieldId = form_field.formFieldId
	LEFT JOIN job_requirement
	ON job_requirement.jobRequirementId = form_field.jobRequirementId
	WHERE form.tenantId = ${tenantId}
	  AND form.formCategory = ${formCategory}
	GROUP BY submitterId, applicantId) AS single_submission
GROUP BY applicantId
ORDER BY rank) foo
WHERE applicantId = ${applicantId}
