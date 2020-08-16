SELECT
	s.applicant_id,
	ARRAY_AGG(s.comment) FILTER (WHERE s.comment IS NOT NULL) AS comments,
	STDDEV_POP(s.submission_score) AS standard_deviation,
	SUM(s.submission_score) AS score,
	COUNT(DISTINCT s.submitter_id) AS submissions_count,
	json_object_agg(s.submitter_id, s.submission) AS submissions,
	array_agg(s.job_requirement_sums) AS requirement_sums_array
FROM
	(SELECT applicant_id,
					submitter_id,
					comment,
					json_object_agg(job_requirement_id, vals) AS submission,
					SUM(job_requirement_sum) AS submission_score,
					json_object_agg(job_requirement_id, job_requirement_sum) AS job_requirement_sums
		FROM
			(SELECT applicant_id,
							submitter_id,
							comment,
							array_agg(
								json_build_object('form_item_id', form_item.form_item_id,
																	'job_requirement_id', form_item.job_requirement_id,
																	'value', sub.value::NUMERIC,
																	'weighing', 1 -- currently weighing is not implemented, therfore default 1 is used
								)
							) AS vals,
							SUM(sub.value::NUMERIC * 1) AS job_requirement_sum, -- 1 is weighing
							form_item.job_requirement_id
				FROM form_submission, jsonb_each_text(submission) sub
				LEFT JOIN form
				ON form.form_id=form_id
				WHERE form.form_category='assessment'
					AND form.organization_id=${organization_id}
				JOIN form_item
				ON form_item.form_item_id = sub.key::UUID
				GROUP BY
					assessment.submitter_id,
					assessment.applicant_id,
					form_item.job_requirement_id
			) AS SUB_QUERY
		GROUP BY 
			submitter_id,
			applicant_id,
			comment
	) as s
JOIN applicant a
ON a.applicant_id=s.applicant_id
WHERE a.job_id=${job_id}
	AND a.organization_id=${organization_id}
GROUP BY s.applicant_id
ORDER BY score DESC
