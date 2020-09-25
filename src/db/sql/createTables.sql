CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS tenant (
  tenant_id UUID DEFAULT uuid_generate_v4(),
  tenant_name TEXT NOT NULL,
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
  tenant_id UUID NOT NULL,
  job_id UUID NOT NULL,
  requirement_label TEXT NOT NULL,
  CONSTRAINT job_requirement_id_pk PRIMARY KEY (job_requirement_id),
  CONSTRAINT job_id_fk FOREIGN KEY (job_id) REFERENCES job(job_id) ON DELETE CASCADE,
  CONSTRAINT tenant_id_fk FOREIGN KEY (tenant_id) REFERENCES tenant(tenant_id) ON DELETE CASCADE
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
CREATE TYPE form_field_component AS ENUM ('input','date_picker', 'textarea', 'select', 'radio', 'checkbox', 'file_upload', 'rating_group');
CREATE TABLE IF NOT EXISTS form_field (
  form_field_id UUID DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  job_requirement_id UUID DEFAULT NULL,
  intent form_field_intent DEFAULT NULL,
  component form_field_component NOT NULL,
  row_index INTEGER NOT NULL,
  label TEXT NOT NULL,
  placeholder TEXT,
  description TEXT,
  default_value TEXT,
  required BOOLEAN DEFAULT FALSE,
  options JSONB,       -- array of options if componen is select, radio, etc.
  props JSONB, -- additional props
  editable BOOLEAN DEFAULT FALSE,
  deletable BOOLEAN DEFAULT FALSE,
  CONSTRAINT form_field_id_pk PRIMARY KEY (form_field_id),
  CONSTRAINT form_id_fk FOREIGN KEY (form_id) REFERENCES form(form_id) ON DELETE CASCADE,
  CONSTRAINT tenant_id_fk FOREIGN KEY (tenant_id) REFERENCES tenant(tenant_id) ON DELETE CASCADE,
  CONSTRAINT job_requirement_id_fk FOREIGN KEY (job_requirement_id) REFERENCES job_requirement(job_requirement_id) ON DELETE SET DEFAULT DEFERRABLE,
  CONSTRAINT row_index_check CHECK (row_index >= 0),
  CONSTRAINT form_id_row_index_unique UNIQUE (form_id, row_index) DEFERRABLE, -- make shure the index inside of the form is unique
  CONSTRAINT options_conditional_not_null CHECK(
    NOT (component='select' OR component='radio' OR component='rating_group' OR component='checkbox')
    OR options IS NOT NULL)
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
  CONSTRAINT tenant_id_fk FOREIGN KEY (tenant_id) REFERENCES tenant(tenant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS form_submission_field (
  form_submission_id UUID,
  form_field_id UUID,
  submission_value TEXT,
  CONSTRAINT form_submission_id_form_field_id_pk PRIMARY KEY (form_submission_id,form_field_id),
  CONSTRAINT form_submission_id FOREIGN KEY (form_submission_id) REFERENCES form_submission(form_submission_id) ON DELETE CASCADE,
  CONSTRAINT form_field_id FOREIGN KEY (form_field_id) REFERENCES form_field(form_field_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS applicant_report (
  applicant_report_id UUID DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  job_id UUID NOT NULL,
  image UUID DEFAULT NULL,
  CONSTRAINT applicant_report_id_pk PRIMARY KEY (applicant_report_id),
  CONSTRAINT tenant_id_fk FOREIGN KEY (tenant_id) REFERENCES tenant(tenant_id) ON DELETE CASCADE,
  CONSTRAINT job_id_fk FOREIGN KEY (job_id) REFERENCES job(job_id) ON DELETE CASCADE,
  CONSTRAINT image_fk FOREIGN KEY (image) REFERENCES form_field(form_field_id) ON DELETE CASCADE,
  CONSTRAINT tenant_id_job_id_uq UNIQUE (tenant_id, job_id)
);

CREATE TABLE IF NOT EXISTS applicant_report_field (
  applicant_report_id UUID,
  form_field_id UUID,
  CONSTRAINT applicant_report_id_form_field_id_pk PRIMARY KEY (applicant_report_id, form_field_id),
  CONSTRAINT applicant_report_id_fk FOREIGN KEY (applicant_report_id) REFERENCES applicant_report(applicant_report_id) ON DELETE CASCADE,
  CONSTRAINT form_field_id_fk FOREIGN KEY (form_field_id) REFERENCES form_field(form_field_id) ON DELETE CASCADE
);
