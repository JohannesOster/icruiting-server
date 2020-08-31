SELECT 
	applicant_id,
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
	WHERE form.form_category='screening'
		AND form.organization_id=${organization_id}
		AND form.job_id=${job_id}
	GROUP BY submitter_id, applicant_id) AS single_submission
GROUP BY applicant_id
ORDER BY score DESC



-- SELECT
-- 	submission.applicant_id,
-- 	ARRAY_AGG(submission.comment) FILTER (WHERE submission.comment IS NOT NULL) AS comments,
-- 	STDDEV_POP(submission.single_score) AS standard_deviation,
-- 	SUM(submission.single_score) AS score,
-- 	COUNT(DISTINCT submission.submitter_id) AS submissions_count
-- FROM 
-- 	(SELECT applicant_id, submitter_id, comment, SUM(VALUE::NUMERIC) AS single_score
-- 	 FROM form_submission, jsonb_each_text(submission) 
-- 	 LEFT JOIN form
-- 	 ON form.form_id=form_id
--    WHERE form.form_category='screening'
-- 	 	 AND form.organization_id=${organization_id}
-- 	 GROUP BY form_submission.applicant_id,
-- 	 					form_submission.submitter_id,
-- 						form_submission.comment
-- 	) submission
-- JOIN applicant
-- ON applicant.applicant_id = submission.applicant_id
-- WHERE applicant.job_id=${job_id}
-- 	AND applicant.organization_id=${organization_id}
-- GROUP BY submission.applicant_id
-- ORDER BY score DESC