SELECT form_submission.*, json_object_agg(form_field_id, submission_value) as submission
FROM form_submission
JOIN form_submission_field
ON form_submission_field.form_submission_id=form_submission.form_submission_id
WHERE submitter_id=${submitter_id}  
  AND applicant_id=${applicant_id}  
  AND form_id=${form_id}  
  AND tenant_id=${tenant_id}
GROUP BY form_submission.form_submission_id;