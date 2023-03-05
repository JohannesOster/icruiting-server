-- liquibase formatted sql
-- changeset johannesoster:1
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE tenant (
  tenant_id UUID DEFAULT uuid_generate_v4() NOT NULL,
  tenant_name TEXT NOT NULL,
  stripe_customer_id TEXT,
  theme TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT tenant_id_pk PRIMARY KEY (tenant_id)
);

CREATE TABLE job (
  job_id UUID DEFAULT uuid_generate_v4() NOT NULL,
  tenant_id UUID NOT NULL,
  job_title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT job_id_pk PRIMARY KEY (job_id),
  CONSTRAINT tenant_id_fk FOREIGN KEY (tenant_id) REFERENCES tenant (tenant_id) ON DELETE CASCADE
);

CREATE TABLE job_requirement (
  job_requirement_id UUID DEFAULT uuid_generate_v4() NOT NULL,
  job_id UUID NOT NULL,
  requirement_label TEXT NOT NULL,
  min_value numeric(10, 4) DEFAULT NULL :: numeric,
  CONSTRAINT job_requirement_id_pk PRIMARY KEY (job_requirement_id),
  CONSTRAINT job_id_fk FOREIGN KEY (job_id) REFERENCES job (job_id) ON DELETE CASCADE
);

CREATE TABLE form (
  form_id UUID DEFAULT uuid_generate_v4() NOT NULL,
  tenant_id UUID NOT NULL,
  job_id UUID NOT NULL,
  form_category TEXT NOT NULL,
  form_title TEXT,
  replica_of UUID,
  CONSTRAINT form_id_pk PRIMARY KEY (form_id),
  CONSTRAINT job_id_fk FOREIGN KEY (job_id) REFERENCES job (job_id) ON DELETE CASCADE,
  CONSTRAINT replica_of_fk FOREIGN KEY (replica_of) REFERENCES form (form_id) ON DELETE CASCADE,
  CONSTRAINT tenant_id_fk FOREIGN KEY (tenant_id) REFERENCES tenant (tenant_id) ON DELETE CASCADE
);

CREATE TABLE form_field (
  form_field_id UUID DEFAULT uuid_generate_v4() NOT NULL,
  form_id UUID NOT NULL,
  job_requirement_id UUID,
  intent TEXT,
  component TEXT NOT NULL,
  row_index INTEGER NOT NULL,
  label TEXT NOT NULL,
  placeholder TEXT,
  description TEXT,
  default_value TEXT,
  required BOOLEAN DEFAULT FALSE,
  options JSONB,
  props JSONB,
  editable BOOLEAN DEFAULT FALSE,
  deletable BOOLEAN DEFAULT FALSE,
  visibility TEXT DEFAULT 'all',
  CONSTRAINT form_field_id_pk PRIMARY KEY (form_field_id),
  CONSTRAINT form_id_row_index_unique UNIQUE (form_id, row_index),
  CONSTRAINT form_id_fk FOREIGN KEY (form_id) REFERENCES form (form_id) ON DELETE CASCADE,
  CONSTRAINT job_requirement_id_fk FOREIGN KEY (job_requirement_id) REFERENCES job_requirement (job_requirement_id) ON DELETE
  SET
    DEFAULT DEFERRABLE
);

CREATE TABLE applicant (
  applicant_id UUID DEFAULT uuid_generate_v4() NOT NULL,
  tenant_id UUID NOT NULL,
  job_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  applicant_status TEXT,
  CONSTRAINT applicant_id_pk PRIMARY KEY (applicant_id),
  CONSTRAINT job_id_id FOREIGN KEY (job_id) REFERENCES job (job_id) ON DELETE CASCADE,
  CONSTRAINT tenant_id_fk FOREIGN KEY (tenant_id) REFERENCES tenant (tenant_id) ON DELETE CASCADE
);

CREATE TABLE form_submission (
  form_submission_id UUID DEFAULT uuid_generate_v4() NOT NULL,
  applicant_id UUID NOT NULL,
  submitter_id TEXT NOT NULL,
  form_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  CONSTRAINT form_submission_id_pk PRIMARY KEY (form_submission_id),
  CONSTRAINT form_id_fk FOREIGN KEY (form_id) REFERENCES form (form_id) ON DELETE CASCADE,
  CONSTRAINT tenant_id_fk FOREIGN KEY (tenant_id) REFERENCES tenant (tenant_id) ON DELETE CASCADE,
  CONSTRAINT applicnat_id_submitter_id_form_id_uq UNIQUE (applicant_id, submitter_id, form_id),
  CONSTRAINT applicant_id FOREIGN KEY (applicant_id) REFERENCES applicant (applicant_id) ON DELETE CASCADE
);

CREATE TABLE form_submission_field (
  form_submission_id UUID NOT NULL,
  form_field_id UUID NOT NULL,
  submission_value TEXT,
  CONSTRAINT form_submission_id_form_field_id_pk PRIMARY KEY (form_submission_id, form_field_id),
  CONSTRAINT form_submission_id FOREIGN KEY (form_submission_id) REFERENCES form_submission (form_submission_id) ON DELETE CASCADE,
  CONSTRAINT form_field_id FOREIGN KEY (form_field_id) REFERENCES form_field (form_field_id) ON DELETE CASCADE
);

CREATE TABLE applicant_attribute (
  applicant_id UUID NOT NULL,
  form_field_id UUID NOT NULL,
  attribute_value TEXT,
  CONSTRAINT applicant_id_form_item_id_pk PRIMARY KEY (applicant_id, form_field_id),
  CONSTRAINT applicant_id_fk FOREIGN KEY (applicant_id) REFERENCES applicant (applicant_id) ON DELETE CASCADE,
  CONSTRAINT form_field_id_fk FOREIGN KEY (form_field_id) REFERENCES form_field (form_field_id) ON DELETE CASCADE
);

CREATE TABLE report_field (
  tenant_id UUID,
  job_id UUID NOT NULL,
  form_field_id UUID NOT NULL,
  CONSTRAINT job_id_form_field_id_pk PRIMARY KEY (job_id, form_field_id),
  CONSTRAINT job_id_fk FOREIGN KEY (job_id) REFERENCES job (job_id) ON DELETE CASCADE,
  CONSTRAINT tenant_id_fk FOREIGN KEY (tenant_id) REFERENCES tenant (tenant_id) ON DELETE CASCADE,
  CONSTRAINT form_field_id FOREIGN KEY (form_field_id) REFERENCES form_field (form_field_id) ON DELETE CASCADE
);

/* ================== VIEWS ================== */
CREATE VIEW ranking AS
SELECT
  submission.tenant_id,
  submission.job_id,
  submission.form_category,
  submission.applicant_id,
  count(
    DISTINCT ROW(
      submission.submitter_id,
      submission.form_id,
      submission.applicant_id
    )
  ) AS submissions_count,
  round(avg(submission.score), 2) AS score,
  row_number() OVER (
    PARTITION BY submission.form_category
    ORDER BY
      avg(submission.score) DESC
  ) AS rank
FROM
  (
    SELECT
      form_submission.form_submission_id,
      form_submission.applicant_id,
      form_submission.submitter_id,
      form_submission.form_id,
      form_submission.tenant_id,
      form.form_category,
      form.job_id,
      sum(
        form_submission_field.submission_value :: numeric
      ) AS score
    FROM
      form_submission
      JOIN form ON form.form_id = form_submission.form_id
      JOIN form_submission_field ON form_submission_field.form_submission_id = form_submission.form_submission_id
      JOIN form_field ON form_field.form_field_id = form_submission_field.form_field_id
      AND form_field.intent = 'sum_up' :: text
    GROUP BY
      form_submission.form_submission_id,
      form.form_id,
      form.form_category,
      form.job_id
  ) submission
GROUP BY
  submission.applicant_id,
  submission.form_category,
  submission.tenant_id,
  submission.job_id;

CREATE VIEW assessments_view AS
SELECT
  form.form_id,
  form.form_title,
  form.form_category,
  form_submission.applicant_id,
  form_submission.submitter_id,
  sum(
    (form_submission_field.submission_value) :: numeric
  ) AS score
FROM
  form_submission
  JOIN form ON form.form_id = form_submission.form_id
  JOIN form_submission_field ON form_submission_field.form_submission_id = form_submission.form_submission_id
  JOIN form_field ON form_field.form_field_id = form_submission_field.form_field_id
WHERE
  form_field.intent = 'sum_up' :: text
GROUP BY
  form.form_id,
  form.form_title,
  form.form_category,
  form_submission.applicant_id,
  form_submission.submitter_id;

CREATE VIEW applicant_view AS
SELECT
  applicant.applicant_id,
  applicant.tenant_id,
  applicant.job_id,
  applicant.created_at,
  applicant.applicant_status,
  array_agg(
    json_build_object(
      'form_field_id',
      form_field.form_field_id,
      'value',
      applicant_attribute.attribute_value
    )
    ORDER BY
      form_field.row_index
  ) FILTER (
    WHERE
      form_field.component <> 'file_upload' :: text
  ) AS attributes,
  array_agg(
    json_build_object(
      'form_field_id',
      form_field.form_field_id,
      'uri',
      applicant_attribute.attribute_value
    )
    ORDER BY
      form_field.row_index
  ) FILTER (
    WHERE
      form_field.component = 'file_upload' :: text
  ) AS files
FROM
  applicant
  LEFT JOIN applicant_attribute ON applicant_attribute.applicant_id = applicant.applicant_id
  LEFT JOIN form_field ON applicant_attribute.form_field_id = form_field.form_field_id
GROUP BY
  applicant.applicant_id;