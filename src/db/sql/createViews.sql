CREATE OR REPLACE VIEW applicant_view AS
	SELECT applicant.*,
	       array_agg(json_build_object(
	         'key', form_field.label,
	         'value', applicant_attribute.attribute_value
	        ) ORDER BY form_field.row_index) FILTER (WHERE form_field.component != 'file_upload') AS attributes,
	       array_agg(json_build_object(
	         'key', form_field.label,
	         'value', applicant_attribute.attribute_value
	        ) ORDER BY form_field.row_index) FILTER (WHERE form_field.component = 'file_upload') AS files
	FROM applicant
	LEFT JOIN applicant_attribute
	ON applicant_attribute.applicant_id = applicant.applicant_id
	LEFT JOIN form_field
	ON applicant_attribute.form_field_id = form_field.form_field_id
	GROUP BY applicant.applicant_id;

CREATE OR REPLACE VIEW form_submission_view AS
	SELECT
		form.job_id,
		form.form_id,
		form_category,
		form.tenant_id,
		submitter_id,
		applicant_id,
		SUM(submission_value::NUMERIC) FILTER (WHERE form_field.intent = 'sum_up') AS score,
		JSON_AGG(JSON_BUILD_OBJECT(
			'form_field_id', form_field.form_field_id,
			'max_value', form_field.max_value,
			'job_requirement_label', job_requirement.requirement_label,
			'label', form_field.label,
			'intent', form_field.intent,
			'value', submission_value
		)) AS submission
	FROM form
	LEFT JOIN
		(
			SELECT
				form_field.*,
				MAX((option.option->>'value')::NUMERIC) FILTER (WHERE intent='sum_up') AS max_value
			FROM form_field
			LEFT JOIN (SELECT form_field_id, option FROM form_field CROSS JOIN jsonb_array_elements(options) as option) as option
			ON form_field.form_field_id = option.form_field_id
			GROUP BY form_field.form_field_id) AS form_field
	ON form_field.form_id = form.form_id
	JOIN
		(SELECT form_submission.*, form_field_id, submission_value
			FROM form_submission
			JOIN form_submission_field
			ON form_submission.form_submission_id = form_submission_field.form_submission_id) AS submission_field
	ON submission_field.form_field_id = form_field.form_field_id
	LEFT JOIN job_requirement
	ON job_requirement.job_requirement_id = form_field.job_requirement_id
	GROUP BY submitter_id, applicant_id, form.form_id, form.job_id, form_category, form.tenant_id;

CREATE OR REPLACE VIEW ranking AS
SELECT
	tenant_id,
	job_id,
	form_category,
	applicant_id,
	COUNT(DISTINCT (submitter_id, form_id, applicant_id)) AS submissions_count,
	ROUND(STDDEV_POP(score), 2) AS standard_deviation,
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
GROUP BY submission.applicant_id, form_category, tenant_id, job_id;

CREATE OR REPLACE VIEW form_submission_field_view AS
SELECT
	form_submission_id,
	submission_value,
	form_field.*,
	options_field.form_field_max
FROM form_submission_field
LEFT JOIN
 (SELECT form_field_id, MAX((option->>'value')::NUMERIC) FILTER (WHERE intent='sum_up') AS form_field_max
  FROM form_field CROSS JOIN jsonb_array_elements(options) AS option
  GROUP BY form_field_id) AS options_field
ON options_field.form_field_id = form_submission_field.form_field_id
LEFT JOIN form_field
ON form_field.form_field_id = form_submission_field.form_field_id;