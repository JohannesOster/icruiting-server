SELECT
  form_submission.*,
  array_agg(
     json_build_object(
       'form_field_id', form_field_id,
       'submission_value', submission_value)
  ) as submission
FROM form_submission
JOIN form ON form.form_id = form_submission.form_id
JOIN form_submission_field
ON form_submission_field.form_submission_id=form_submission.form_submission_id
WHERE form_submission.tenant_id=${tenant_id}
  AND job_id=${job_id}
  AND form_category=${form_category}
GROUP BY form_submission.form_submission_id;
