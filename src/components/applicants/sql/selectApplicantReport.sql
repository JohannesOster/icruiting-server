SELECT
	applicant_report.applicantReportId,
	applicant_report.tenantId,
	jobId,
	json_build_object('label', imageField.label, 'formFieldId', imageField.formFieldId) as image,
	array_agg(json_build_object('label', attribute.label, 'formFieldId', attribute.formFieldId)) as attributes
FROM applicant_report
LEFT JOIN (
	SELECT applicantReportId, form_field.* FROM applicant_report_field
	LEFT JOIN form_field ON form_field.formFieldId = applicant_report_field.formFieldId
) as attribute ON attribute.applicantReportId = applicant_report.applicantReportId
LEFT JOIN form_field imageField
ON imageField.formFieldId = applicant_report.image
WHERE applicant_report.tenantId=${tenantId}
  AND applicant_report.jobId=${jobId}
GROUP BY applicant_report.applicantReportId, imageField.label, imageField.formFieldId
