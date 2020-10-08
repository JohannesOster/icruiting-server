SELECT applicant.*,
       COUNT(*) OVER () total_count,
       array_agg(json_build_object(
         'key', form_field.label,
         'value', applicant_attribute.attribute_value
        )) FILTER (WHERE form_field.component != 'file_upload') AS attributes,
       array_agg(json_build_object(
         'key', form_field.label,
         'value', applicant_attribute.attribute_value
        )) FILTER (WHERE form_field.component = 'file_upload') AS files,
        screening_exists(${tenant_id}, ${user_id}, applicant.applicant_id)
FROM applicant
LEFT JOIN applicant_attribute
ON applicant_attribute.applicant_id = applicant.applicant_id
LEFT JOIN form_field
ON applicant_attribute.form_field_id = form_field.form_field_id
LEFT JOIN (
	SELECT attribute_value AS order_value, applicant_id
	FROM applicant_attribute
	LEFT JOIN form_field
	ON applicant_attribute.form_field_id = form_field.form_field_id
	WHERE form_field.label = ${order_by}) AS order_query
ON ${order_by} IS NOT NULL AND order_query.applicant_id = applicant.applicant_id
WHERE applicant.tenant_id = ${tenant_id}
  AND (applicant.job_id = ${job_id} OR ${job_id} IS NULL)
GROUP BY applicant.applicant_id, order_query.order_value
ORDER BY order_query.order_value
LIMIT ${limit} OFFSET ${offset};
