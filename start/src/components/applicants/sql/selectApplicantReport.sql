SELECT
	applicant_report.applicant_report_id,
	applicant_report.tenant_id,
	job_id,
	json_build_object('label', image_field.label, 'form_field_id', image_field.form_field_id) as image,
	array_agg(json_build_object('label', attribute.label, 'form_field_id', attribute.form_field_id)) as attributes
FROM applicant_report
LEFT JOIN (
	SELECT applicant_report_id, form_field.* FROM applicant_report_field
	LEFT JOIN form_field ON form_field.form_field_id = applicant_report_field.form_field_id
) as attribute ON attribute.applicant_report_id = applicant_report.applicant_report_id
LEFT JOIN form_field image_field
ON image_field.form_field_id = applicant_report.image
WHERE applicant_report.tenant_id=${tenant_id}
  AND applicant_report.job_id=${job_id}
GROUP BY applicant_report.applicant_report_id, image_field.label, image_field.form_field_id
