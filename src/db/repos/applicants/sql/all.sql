SELECT applicant.*,
       COUNT(*) OVER () total_count,
       screening_exists(${tenant_id}, ${user_id}, applicant.applicant_id)
FROM applicant_view AS applicant
LEFT JOIN (
	SELECT attribute_value AS order_value, applicant_id
	FROM applicant_attribute
	LEFT JOIN form_field
	ON applicant_attribute.form_field_id = form_field.form_field_id
	WHERE form_field.label = ${order_by}) AS order_query
ON ${order_by} IS NOT NULL AND order_query.applicant_id = applicant.applicant_id
WHERE applicant.tenant_id = ${tenant_id}
  AND (applicant.job_id = ${job_id} OR ${job_id} IS NULL)
ORDER BY order_query.order_value
LIMIT ${limit} OFFSET ${offset};
