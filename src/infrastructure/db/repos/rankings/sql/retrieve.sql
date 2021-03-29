SELECT
	tenant_id,
	job_id,
	form_category,
	applicant_id,
	ROUND(AVG(fom_score), 2) AS score,
  ROW_NUMBER() OVER (PARTITION BY form_category ORDER BY AVG(fom_score) DESC) AS rank,
	SUM(form_submission_ids) AS submissions_count
FROM
(SELECT
	applicant_id,
	form_category,
	tenant_id,
	job_id,
	form_id,
	AVG(form_submission_score) AS fom_score,
	COUNT(form_submission_id) AS form_submission_ids
FROM
	(SELECT
		form_submission.*,
		form_category,
		job_id,
		SUM(submission_value::NUMERIC) AS form_submission_score
	 FROM form_submission
	 JOIN form ON form.form_id = form_submission.form_id
	 JOIN form_submission_field
	 ON form_submission_field.form_submission_id = form_submission.form_submission_id
	 JOIN form_field
	 ON form_field.form_field_id = form_submission_field.form_field_id AND form_field.intent='sum_up'
	 WHERE form_category=${form_category} AND form_submission.tenant_id=${tenant_id} AND job_id=${job_id}
	 GROUP BY form_submission.form_submission_id, form.form_id, form_category, job_id) AS form_submission
GROUP BY applicant_id, form_category, tenant_id, job_id, form_id) AS inner_query
GROUP BY applicant_id, form_category, tenant_id, job_id;