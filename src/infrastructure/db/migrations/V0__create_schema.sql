CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABLES
CREATE TABLE IF NOT EXISTS tenant (
  tenant_id UUID DEFAULT uuid_generate_v4(),
  tenant_name TEXT NOT NULL,
  stripe_customer_id TEXT,
  theme TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tenant_id_pk PRIMARY KEY (tenant_id)
);

CREATE TABLE IF NOT EXISTS job (
  job_id UUID DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  job_title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT job_id_pk PRIMARY KEY (job_id),
  CONSTRAINT tenant_id_fk FOREIGN KEY (tenant_id) REFERENCES tenant(tenant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_requirement (
  job_requirement_id UUID DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL,
  requirement_label TEXT NOT NULL,
  min_value NUMERIC(10,4) DEFAULT NULL,
  CONSTRAINT job_requirement_id_pk PRIMARY KEY (job_requirement_id),
  CONSTRAINT job_id_fk FOREIGN KEY (job_id) REFERENCES job(job_id) ON DELETE CASCADE
);

CREATE TYPE form_category AS ENUM ('application', 'screening', 'assessment');
CREATE TABLE IF NOT EXISTS form (
  form_id UUID DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  job_id UUID NOT NULL,
  form_category form_category NOT NULL,
  form_title TEXT DEFAULT NULL,
  CONSTRAINT form_id_pk PRIMARY KEY (form_id),
  CONSTRAINT tenant_id_fk FOREIGN KEY (tenant_id) REFERENCES tenant(tenant_id) ON DELETE CASCADE,
  CONSTRAINT job_id_fk FOREIGN KEY (job_id) REFERENCES job(job_id) ON DELETE CASCADE,
  CONSTRAINT form_title_assessment_form_not_null CHECK(form_title IS NOT NULL OR form_category != 'assessment')
);

CREATE TYPE form_field_intent AS ENUM ('aggregate', 'count_distinct', 'sum_up');
CREATE TYPE form_field_component AS ENUM ('input', 'textarea', 'select', 'radio', 'checkbox', 'file_upload', 'rating_group', 'section_header');
CREATE TABLE IF NOT EXISTS form_field (
  form_field_id UUID DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL,
  job_requirement_id UUID DEFAULT NULL,
  intent form_field_intent DEFAULT NULL,
  component form_field_component NOT NULL,
  row_index INTEGER NOT NULL,
  label TEXT NOT NULL,
  placeholder TEXT,
  description TEXT,
  default_value TEXT,
  required BOOLEAN DEFAULT FALSE,
  options JSONB, -- array of options if componen is select, radio, etc.
  props JSONB, -- additional props
  editable BOOLEAN DEFAULT FALSE,
  deletable BOOLEAN DEFAULT FALSE,
  CONSTRAINT form_field_id_pk PRIMARY KEY (form_field_id),
  CONSTRAINT form_id_fk FOREIGN KEY (form_id) REFERENCES form(form_id) ON DELETE CASCADE,
  CONSTRAINT job_requirement_id_fk FOREIGN KEY (job_requirement_id) REFERENCES job_requirement(job_requirement_id) ON DELETE SET DEFAULT DEFERRABLE,
  CONSTRAINT row_index_check CHECK (row_index >= 0),
  CONSTRAINT form_id_row_index_unique UNIQUE (form_id, row_index) DEFERRABLE, -- make shure the index inside of the form is unique
  CONSTRAINT options_conditional_not_null CHECK(
    NOT (component='select' OR component='radio' OR component='rating_group' OR component='checkbox')
    OR options IS NOT NULL),
  CONSTRAINT section_header_no_intent CHECK(NOT component='section_header' OR intent IS NULL)
);

CREATE TABLE IF NOT EXISTS applicant (
  applicant_id UUID DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  job_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT applicant_id_pk PRIMARY KEY (applicant_id),
  CONSTRAINT tenant_id_fk FOREIGN KEY (tenant_id) REFERENCES tenant(tenant_id) ON DELETE CASCADE,
  CONSTRAINT job_id_id FOREIGN KEY (job_id) REFERENCES job(job_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS applicant_attribute (
  applicant_id UUID NOT NULL,
  form_field_id UUID NOT NULL,
  attribute_value TEXT,
  CONSTRAINT applicant_id_form_item_id_pk PRIMARY KEY (applicant_id, form_field_id),
  CONSTRAINT applicant_id_fk FOREIGN KEY (applicant_id) REFERENCES applicant(applicant_id) ON DELETE CASCADE,
  CONSTRAINT form_field_id_fk FOREIGN KEY (form_field_id) REFERENCES form_field(form_field_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS form_submission (
  form_submission_id UUID DEFAULT uuid_generate_v4(),
  applicant_id UUID NOT NULL,
  submitter_id TEXT NOT NULL, -- id of submitting user
  form_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  CONSTRAINT form_submission_id_pk PRIMARY KEY (form_submission_id),
  CONSTRAINT form_id_fk FOREIGN KEY (form_id) REFERENCES form(form_id) ON DELETE CASCADE,
  CONSTRAINT applicant_id FOREIGN KEY (applicant_id) REFERENCES applicant(applicant_id) ON DELETE CASCADE,
  CONSTRAINT tenant_id_fk FOREIGN KEY (tenant_id) REFERENCES tenant(tenant_id) ON DELETE CASCADE,
  CONSTRAINT applicnat_id_submitter_id_form_id_uq UNIQUE (applicant_id,submitter_id,form_id)
);

CREATE TABLE IF NOT EXISTS form_submission_field (
  form_submission_id UUID,
  form_field_id UUID,
  submission_value TEXT,
  CONSTRAINT form_submission_id_form_field_id_pk PRIMARY KEY (form_submission_id,form_field_id),
  CONSTRAINT form_submission_id FOREIGN KEY (form_submission_id) REFERENCES form_submission(form_submission_id) ON DELETE CASCADE,
  CONSTRAINT form_field_id FOREIGN KEY (form_field_id) REFERENCES form_field(form_field_id) ON DELETE CASCADE
);

-- VIEWS
CREATE OR REPLACE VIEW applicant_view AS
SELECT applicant.*,
  array_agg(json_build_object(
    'form_field_id', form_field.form_field_id,
    'value', applicant_attribute.attribute_value
    ) ORDER BY form_field.row_index) FILTER (WHERE form_field.component != 'file_upload') AS attributes,
  array_agg(json_build_object(
    'form_field_id', form_field.form_field_id,
    'uri', applicant_attribute.attribute_value
    ) ORDER BY form_field.row_index) FILTER (WHERE form_field.component = 'file_upload') AS files
FROM applicant
LEFT JOIN applicant_attribute
ON applicant_attribute.applicant_id = applicant.applicant_id
LEFT JOIN form_field
ON applicant_attribute.form_field_id = form_field.form_field_id
GROUP BY applicant.applicant_id;

CREATE OR REPLACE VIEW ranking AS
SELECT
	tenant_id,
	job_id,
	form_category,
	applicant_id,
	COUNT(DISTINCT (submitter_id, form_id, applicant_id)) AS submissions_count,
	ROUND(STDDEV_POP(score), 2) AS standard_deviation,
	ROUND(AVG(score), 2) AS score,
  ROW_NUMBER() OVER (PARTITION BY form_category ORDER BY AVG(score) DESC) AS rank
FROM
	(SELECT
		form_submission.*,
		form_category,
		job_id,
		SUM(submission_value::NUMERIC) AS score
	 FROM form_submission
	 JOIN form ON form.form_id = form_submission.form_id
	 JOIN form_submission_field
	 ON form_submission_field.form_submission_id = form_submission.form_submission_id
	 JOIN form_field
	 ON form_field.form_field_id = form_submission_field.form_field_id AND form_field.intent='sum_up'
	 GROUP BY form_submission.form_submission_id, form.form_id, form_category, job_id) AS submission
GROUP BY submission.applicant_id, form_category, tenant_id, job_id;

CREATE OR REPLACE VIEW assessments_view AS
SELECT
	form.form_id,
	form_title,
	form_category,
	applicant_id,
	submitter_id,
	SUM(submission_value::NUMERIC) AS score
FROM form_submission
JOIN form ON form.form_id = form_submission.form_id
JOIN form_submission_field ON form_submission_field.form_submission_id = form_submission.form_submission_id
JOIN form_field ON form_field.form_field_id = form_submission_field.form_field_id
WHERE form_field.intent = 'sum_up'
GROUP BY form.form_id, form_title, form_category, applicant_id, submitter_id;
