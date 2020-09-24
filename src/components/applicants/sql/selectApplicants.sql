SELECT applicant.*,
       array_agg(json_build_object(
         'key', form_field.label,
         'value', applicantAttribute.attributeValue
        )) FILTER (WHERE form_field.component != 'file_upload') AS attributes,
       array_agg(json_build_object(
         'key', form_field.label,
         'value', applicantAttribute.attributeValue
        )) FILTER (WHERE form_field.component = 'file_upload') AS files,
       COUNT(screening.applicantId)::int::boolean as screening_exists
FROM applicant
LEFT JOIN applicantAttribute
ON applicantAttribute.applicantId = applicant.applicantId
LEFT JOIN form_field
ON applicantAttribute.formFieldId = form_field.formFieldId
LEFT JOIN
  (SELECT applicantId
   FROM form_submission
   LEFT JOIN form
   ON form_submission.formId = form.formId
   WHERE form.tenantId = ${tenantId}
     AND form.formCategory = 'screening'
     AND form_submission.submitterId = ${userId}
  ) as screening
ON screening.applicantId = applicant.applicantId
WHERE applicant.tenantId = ${tenantId}
  AND (applicant.jobId = ${jobId} OR ${jobId} IS NULL)
  AND (applicant.applicantId = ${applicantId} OR ${applicantId} IS NULL)
GROUP BY applicant.applicantId
