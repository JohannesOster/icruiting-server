SELECT imageField.label as image, array_agg(attribute.label) as attributes
FROM applicant_report
LEFT JOIN (
	SELECT applicant_report_id, form_field.label as label FROM applicant_report_field 
	LEFT JOIN form_field ON form_field.form_field_id = applicant_report_field.form_field_id
) as attribute ON attribute.applicant_report_id = applicant_report.applicant_report_id
LEFT JOIN form_field imageField
ON imageField.form_field_id = applicant_report.image
WHERE applicant_report.tenant_id=${tenant_id}
  AND applicant_report.job_id=${job_id}
GROUP BY applicant_report.applicant_report_id, imageField.label