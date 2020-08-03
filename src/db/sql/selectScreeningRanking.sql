SELECT
	s.applicant_id,
	ARRAY_AGG(s.comment) FILTER (WHERE s.comment IS NOT NULL) AS comments,
	STDDEV_POP(s.single_score) AS standard_deviation,
	sum(s.single_score) AS score,
	COUNT(DISTINCT s.submitter_id) AS submissions_count
FROM 
	(
		SELECT 
			applicant_id,
			comment,
			submitter_id,
			sum(VALUE::NUMERIC) AS single_score
		FROM 
			screening,
			jsonb_each_text(submission)
		GROUP BY 
			screening.submitter_id,
			screening.applicant_id
	) as s
JOIN 
	applicant a
ON 
	a.applicant_id = s.applicant_id
WHERE a.job_id = ${job_id}
GROUP BY 
	s.applicant_id
ORDER BY score DESC
