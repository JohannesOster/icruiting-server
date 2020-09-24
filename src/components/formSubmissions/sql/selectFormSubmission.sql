SELECT form_submission.*, json_object_agg(formFieldId, submission_value) as submission
FROM form_submission
JOIN form_submission_field
ON form_submission_field.formSubmissionId=form_submission.formSubmissionId
WHERE submitterId=${submitterId}
  AND applicantId=${applicantId}
  AND formId=${formId}
  AND tenantId=${tenantId}
GROUP BY form_submission.formSubmissionId;
