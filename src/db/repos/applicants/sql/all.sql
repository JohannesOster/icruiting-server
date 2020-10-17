SELECT applicant.*,
       COUNT(*) OVER () total_count,
       screening_exists(${tenant_id}, ${user_id}, applicant.applicant_id)
FROM applicant_view AS applicant
LEFT JOIN (
	SELECT applicant_id, attribute->>'value' AS order_value
	FROM applicant_view CROSS JOIN unnest(attributes) AS attribute
	WHERE attribute->>'key' = ${order_by}) AS order_query
ON ${order_by} IS NOT NULL AND order_query.applicant_id = applicant.applicant_id
JOIN (
	SELECT applicant_id
	FROM applicant_view
	CROSS JOIN unnest(attributes) AS attribute
	WHERE difference(attribute->>'value',${filter}) > 2
	  OR ${filter} Is NULL
	GROUP BY applicant_id
) AS filter_query
ON filter_query.applicant_id = applicant.applicant_id
WHERE applicant.tenant_id = ${tenant_id}
  AND (applicant.job_id = ${job_id} OR ${job_id} IS NULL)
ORDER BY order_query.order_value
LIMIT ${limit} OFFSET ${offset};