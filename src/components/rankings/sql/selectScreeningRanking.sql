SELECT
	submission.applicant_id,
	ARRAY_AGG(submission.comment) FILTER (WHERE submission.comment IS NOT NULL) AS comments,
	STDDEV_POP(submission.single_score) AS standard_deviation,
	SUM(submission.single_score) AS score,
	COUNT(DISTINCT submission.submitter_id) AS submissions_count
FROM 
	(SELECT applicant_id, submitter_id, comment, SUM(VALUE::NUMERIC) AS single_score
	 FROM form_submission, jsonb_each_text(submission) 
	 LEFT JOIN form
	 ON form.form_id=form_id
   WHERE form.form_category='screening'
	 	 AND form.organization_id=${organization_id}
	 GROUP BY form_submission.applicant_id,
	 					form_submission.submitter_id,
						form_submission.comment
	) submission
JOIN applicant
ON applicant.applicant_id = submission.applicant_id
WHERE applicant.job_id=${job_id}
	AND applicant.organization_id=${organization_id}
GROUP BY submission.applicant_id
ORDER BY score DESC
