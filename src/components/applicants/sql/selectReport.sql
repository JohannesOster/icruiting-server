SELECT * FROM 
   (SELECT
	applicant_id,
	job_id,
	form_category,
	form.tenant_id,
	ARRAY_AGG(
		JSON_BUILD_OBJECT(
         'form_id', form.form_id,
         'form_title', form_title,
         'form_score', form_score,
         'form_fields_result', form_fields_result,
         'form_stddev', form_stddev,
         'overall_form_stddev', overall_form_stddev
		) ORDER BY form_title
	) AS form_category_result,
	ROUND(AVG(form_score),2) AS form_category_score,
   SUM(form_stddev) AS form_category_stddev,
	ROUND(AVG(overall_form_score),2) AS overall_form_category_score,
   SUM(overall_form_stddev) AS overall_form_category_stddev,
   ROW_NUMBER() OVER (PARTITION BY form_category ORDER BY AVG(form_score) DESC) AS rank
FROM
	(SELECT
		applicant_id,
		form_id,
		SUM(form_field_avg) AS form_score,
		SUM(overall_form_field_avg) AS overall_form_score,
      SUM(form_field_stddev) AS form_stddev,
      SUM(overall_form_field_stddev) AS overall_form_stddev,
		ARRAY_AGG(
			JSON_BUILD_OBJECT(
				'form_field_id', form_field_id,
				'job_requirement_id', job_requirement_id,
				'intent', intent,
        'label', label,
        'row_index', row_index,
				'component', component,
				'form_field_max', form_field_max,
				'aggregated_values', aggregated_values,
				'form_field_avg', form_field_avg,
				'form_field_stddev', form_field_stddev,
				'max_form_field_submission_value',max_form_field_submission_value,
				'min_form_field_submission_value',min_form_field_submission_value,
				'overall_form_field_avg',overall_form_field_avg,
				'overall_form_field_stddev', overall_form_field_stddev,
				'overall_max_form_field_submission_value',overall_max_form_field_submission_value,
				'overall_min_form_field_submission_value',overall_min_form_field_submission_value,
				'aggregated_submissions', aggregated_submissions
			) ORDER BY row_index
		) AS form_fields_result
	FROM 
		(SELECT
			applicant_id,
			form_id,
			form_field_id,
			job_requirement_id,
			intent,
			component,
			row_index,
			label,
			form_field_max,
			aggregated_values,
			form_field_avg,
			form_field_stddev,
			max_form_field_submission_value,
			min_form_field_submission_value,
			overall_form_field_avg,
			overall_form_field_stddev,
			overall_max_form_field_submission_value,
			overall_min_form_field_submission_value,
			ARRAY_AGG(JSON_BUILD_OBJECT(
				'form_submission_id', form_submission_id,
				'submitter_id', submitter_id,
				'submission_value', submission_value
			)) AS aggregated_submissions
		FROM 
			(SELECT
				*,
				-- applicant specific analysis
				ARRAY_AGG(submission_value) FILTER (WHERE (intent='aggregate' OR intent='count_distinct') AND submission_value <> '') OVER (PARTITION BY form_field_id, applicant_id) AS aggregated_values,
				ROUND(AVG(submission_value::NUMERIC) FILTER (WHERE intent='sum_up') OVER (PARTITION BY form_field_id, applicant_id),2) AS form_field_avg, -- submission average for this field for applicant
				ROUND(STDDEV_POP(submission_value::NUMERIC) FILTER (WHERE intent='sum_up') OVER (PARTITION BY form_field_id, applicant_id), 2) AS form_field_stddev, -- stddev for one field for one applicant
				MAX(submission_value::NUMERIC) FILTER (WHERE intent='sum_up') OVER (PARTITION BY form_field_id, applicant_id) AS max_form_field_submission_value, -- the max value that someone has given for this applicant
				MIN(submission_value::NUMERIC) FILTER (WHERE intent='sum_up') OVER (PARTITION BY form_field_id, applicant_id) AS min_form_field_submission_value, -- the worst value that someone has given for this applicant	
				-- overall (=all applicants) analysis
				ROUND(AVG(submission_value::NUMERIC) FILTER (WHERE intent='sum_up') OVER (PARTITION BY form_field_id),2) AS overall_form_field_avg, -- overall average for this specific field
				ROUND(STDDEV_POP(submission_value::NUMERIC) FILTER (WHERE intent='sum_up') OVER (PARTITION BY form_field_id), 2) AS overall_form_field_stddev, -- stddev for one field but for all applicants (Is this a field where the stddev is high in general or only for this applicant?)
				MAX(submission_value::NUMERIC) FILTER (WHERE intent='sum_up') OVER (PARTITION BY form_field_id) AS overall_max_form_field_submission_value, -- the max value that someone has given for all applicants
				MIN(submission_value::NUMERIC) FILTER (WHERE intent='sum_up') OVER (PARTITION BY form_field_id) AS overall_min_form_field_submission_value  -- the max value that someone has given for all applicants
			FROM
				(SELECT applicant_id, submitter_id, tenant_id, form_submission_field_view.*
				FROM form_submission
				JOIN form_submission_field_view
				ON form_submission_field_view.form_submission_id = form_submission.form_submission_id) AS form_submission_field) AS enhanced_form_submission_field
		   GROUP BY applicant_id,
				 form_id,
				 form_field_id,
				 job_requirement_id,
				 intent,
				 component,
				 row_index,
				 label,
				 form_field_max,
				 aggregated_values,
				 form_field_avg,
				 form_field_stddev,
				 max_form_field_submission_value,
				 min_form_field_submission_value,
				 overall_form_field_avg,
				 overall_form_field_stddev,
				 overall_max_form_field_submission_value,
				 overall_min_form_field_submission_value) AS merged_form_submission_field -- average, std, min, ma & aggregated submission + overall statistics for each form_field and applicant => (form_field_id, applicant_id) - tupel is unambiguously / unique
         GROUP BY form_id, applicant_id) AS form_result
      JOIN form ON form.form_id = form_result.form_id
      GROUP BY applicant_id,
               job_id,
               form_category,
               form.tenant_id) AS report
WHERE form_category=${form_category}
  AND applicant_id=${applicant_id};
