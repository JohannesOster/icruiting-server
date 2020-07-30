SELECT
	s.applicant_id,
	STDDEV_POP(s.single_score) as standard_deviation,
	sum(s.single_score) as score
FROM 
	(SELECT applicant_id, sum(VALUE::NUMERIC) AS single_score FROM screening, jsonb_each_text(submission) GROUP BY screening.submitter_id, screening.applicant_id) as s
JOIN 
	applicant a
ON 
	a.applicant_id = s.applicant_id
WHERE a.job_id = ${job_id}
GROUP BY 
	s.applicant_id
ORDER BY score DESC
