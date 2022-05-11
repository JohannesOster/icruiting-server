SELECT
	form_score.applicant_id,
  	ROW_NUMBER() OVER (ORDER BY AVG(form_score) DESC) AS rank,
	ROUND(AVG(form_score), 2) AS score,
	COUNT(DISTINCT form_submission_id) AS submissions_count
FROM
	(SELECT
		applicant_id,
		SUM(form_field_score) as form_score
	FROM
		(SELECT
			applicant_id,
			form.form_id,
			form_field.form_field_id,
			AVG(submission_value::NUMERIC) AS form_field_score
		FROM form_submission_field
		JOIN form_field ON form_field.form_field_id=form_submission_field.form_field_id
		JOIN form_submission ON form_submission.form_submission_id=form_submission_field.form_submission_id
		JOIN form ON form_submission.form_id=form.form_id
		WHERE form_field.intent='sum_up'
			AND form.form_id=${form_id}
			AND form.tenant_id=${tenant_id}
			AND form.job_id=${job_id}
		GROUP BY applicant_id, form_field.form_field_id, form.form_id) AS form_field_score
	GROUP BY form_id, applicant_id) AS form_score
JOIN form_submission ON form_submission.applicant_id=form_score.applicant_id
JOIN form ON form.form_id=form_submission.form_id
				 AND form.form_id = ${form_id}
				 AND form.tenant_id=${tenant_id}
				 AND form.job_id=${job_id}
GROUP BY form_score.applicant_id

