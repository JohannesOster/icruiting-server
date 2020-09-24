SELECT applicant.*,
       array_agg(json_build_object(
         'key', form_field.label,
         'value', applicantAttribute.attributeValue
        )) FILTER (WHERE form_field.component != 'file_upload') AS attributes,
       array_agg(json_build_object(
         'key', form_field.label,
         'value', applicantAttribute.attributeValue
        )) FILTER (WHERE form_field.component = 'file_upload') AS files
FROM applicant
LEFT JOIN applicantAttribute
ON applicantAttribute.applicantId = applicant.applicantId
LEFT JOIN form_field
ON applicantAttribute.formFieldId = form_field.formFieldId
WHERE applicant.tenantId = ${tenantId}
  AND (applicant.applicantId = ${applicantId} OR ${applicantId} IS NULL)
GROUP BY applicant.applicantId
