SELECT applicant.*,
       assessments_view.assessments,
       COUNT(*) OVER () total_count
FROM applicant_view AS applicant
LEFT JOIN (
	SELECT applicant_id, attribute->>'value' AS order_value
	FROM applicant_view CROSS JOIN UNNEST(attributes) AS attribute
	JOIN form_field ON form_field.form_field_id::TEXT = attribute->>'form_field_id'
	WHERE label = ${order_by}) AS order_query
ON ${order_by} IS NOT NULL AND order_query.applicant_id = applicant.applicant_id
JOIN (
	SELECT * FROM 
	(	
		-- turn [{form_field_id: '123df-asdf1-2asdf-1223dfa', value: 'Max Mustermann'}, ...] to {'Vollständiger Name': 'Max Mustermann', 'Telefonnummer': '...}
		SELECT applicant_id, json_object_agg(label, attribute->>'value') as attributes
		FROM applicant_view CROSS JOIN UNNEST(attributes) AS attribute
		JOIN form_field ON form_field.form_field_id::TEXT = attribute->>'form_field_id'
		GROUP BY applicant_id
	) AS converted
	${filter_attributes:raw}
) AS filter_query
ON filter_query.applicant_id = applicant.applicant_id
LEFT JOIN
	(SELECT
		applicant_id,
		submitter_id,
		ARRAY_AGG(
			JSON_BUILD_OBJECT(
				'form_id', form_id,
				'form_category', form_category,
				'form_title', form_title,
				'score', score
			) ORDER BY form_title
		) AS assessments
	FROM assessments_view 
	GROUP BY applicant_id, submitter_id) as assessments_view
ON assessments_view.applicant_id = applicant.applicant_id AND assessments_view.submitter_id=${user_id}
WHERE applicant.tenant_id = ${tenant_id}
  AND (applicant.job_id = ${job_id} OR ${job_id} IS NULL)
  ${filter_overall:raw}
ORDER BY order_query.order_value
LIMIT ${limit} OFFSET ${offset};