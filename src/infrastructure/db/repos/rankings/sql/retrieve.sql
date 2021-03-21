SELECT
	tenant_id,
	job_id,
	form_category,
	applicant_id,
	COUNT(DISTINCT (submitter_id, form_id, applicant_id)) AS submissions_count,
	ROUND(AVG(score), 2) AS score,
  ROW_NUMBER() OVER (PARTITION BY form_category ORDER BY AVG(score) DESC) AS rank
FROM
	(SELECT
		form_submission.*,
		form_category,
		job_id,
		SUM(submission_value::NUMERIC) AS score
	 FROM form_submission
	 JOIN form ON form.form_id = form_submission.form_id
	 JOIN form_submission_field
	 ON form_submission_field.form_submission_id = form_submission.form_submission_id
	 JOIN form_field
	 ON form_field.form_field_id = form_submission_field.form_field_id AND form_field.intent='sum_up'
	 GROUP BY form_submission.form_submission_id, form.form_id, form_category, job_id) AS submission
WHERE form_category=${form_category}
	AND tenant_id=${tenant_id}
	AND job_id=${job_id}
GROUP BY submission.applicant_id, form_category, tenant_id, job_id;
