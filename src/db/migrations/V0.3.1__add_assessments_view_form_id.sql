DROP VIEW IF EXISTS assessments_view;
CREATE OR REPLACE VIEW assessments_view AS
SELECT
	form.form_id,
	form_title,
	form_category,
	applicant_id,
	submitter_id,
	SUM(submission_value::NUMERIC) AS score
FROM form_submission
JOIN form ON form.form_id = form_submission.form_id
JOIN form_submission_field ON form_submission_field.form_submission_id = form_submission.form_submission_id
JOIN form_field ON form_field.form_field_id = form_submission_field.form_field_id
WHERE form_field.intent = 'sum_up'
GROUP BY form.form_id, form_title, form_category, applicant_id, submitter_id;
