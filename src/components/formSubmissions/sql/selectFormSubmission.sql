SELECT form_submission.*, json_object_agg(form_field_id, submission_value) as submission
FROM form_submission
JOIN form_submission_field
ON form_submission_field.form_submission_id=form_submission.form_submission_id
WHERE submitterId=${submitterId}
  AND applicantId=${applicantId}
  AND form_id=${formId}
  AND tenant_id=${tenantId}
GROUP BY form_submission.form_submission_id;
