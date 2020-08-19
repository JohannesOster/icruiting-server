
SELECT 
	applicant_id,
	COUNT(DISTINCT submitter_id) AS submissions_count,
	ARRAY_AGG(comment) FILTER (WHERE comment IS NOT NULL) AS comments,
	STDDEV_POP(form_submission_score) AS standard_deviation,
	SUM(form_submission_score) AS score,
	ARRAY_AGG(form_submission.submission) AS submissions
FROM
(SELECT
	submission_field.submitter_id,
	submission_field.applicant_id,
	submission_field.comment,
	ARRAY_AGG(JSON_BUILD_OBJECT(
		'form_item_id', form_item.form_item_id,
		'job_requirement_id', form_item.job_requirement_id,
		'weighing', form_item.weighting,
		'value', submission_field.value
	)) submission,
	SUM(submission_field.value * form_item.weighting) AS form_submission_score
FROM form
JOIN form_item
ON form_item.form_id=form.form_id
JOIN 
	(SELECT applicant_id, submitter_id, comment, KEY AS form_item_id, VALUE::NUMERIC
	 FROM form_submission, jsonb_each_text(submission)) AS submission_field
ON submission_field.form_item_id::UUID = form_item.form_item_id
WHERE form.form_category='assessment'
GROUP BY
	submission_field.submitter_id,
	submission_field.applicant_id,
	submission_field.comment) form_submission
GROUP BY 
	applicant_id


