SELECT 
	form_submission_field.submission_value,
	form_submission.applicant_id,
	form_submission.submitter_id,
	form_field.form_field_id,
	form_field.intent,
	form_field.row_index,
	form_field.label,
	form_field.options,
	form.form_id,
	form.form_title,
	form.form_category,
	job.job_title,
	job_requirement.requirement_label,
	job_requirement.job_requirement_id
FROM form_submission_field
INNER JOIN form_field ON form_field.form_field_id = form_submission_field.form_field_id
INNER JOIN form_submission ON form_submission.form_submission_id = form_submission_field.form_submission_id
INNER JOIN form ON form.form_id = form_submission.form_id
INNER JOIN job ON form.job_id = job.job_id
INNER JOIN job_requirement ON job_requirement.job_requirement_id = form_field.job_requirement_id
WHERE form.form_category = ${form_category}
	AND form.tenant_id = ${tenant_id};
