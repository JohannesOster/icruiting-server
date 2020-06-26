SELECT 
	s.applicant_id,
	sum(VALUE::NUMERIC) as score
FROM 
	screening s
JOIN 
	applicant a
ON 
	a.applicant_id = s.applicant_id, jsonb_each_text(s.submission) AS sum
WHERE a.job_id = ${job_id}
GROUP BY 
	s.applicant_id
ORDER BY score DESC
