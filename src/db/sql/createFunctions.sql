CREATE OR REPLACE FUNCTION screening_exists(tenant_id UUID, user_id TEXT, applicant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE screening_exists BOOLEAN;
BEGIN
  SELECT COUNT(1)::int::boolean
  INTO screening_exists
  FROM form_submission
  LEFT JOIN form
  ON form_submission.form_id = form.form_id
  WHERE form.tenant_id = $1
    AND form.form_category = 'screening'
    AND form_submission.submitter_id = $2
    AND form_submission.applicant_id = $3;
  
  RETURN screening_exists;
END
$$ LANGUAGE plpgsql;