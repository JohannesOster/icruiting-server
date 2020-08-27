CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS organization (
  organization_id UUID DEFAULT uuid_generate_v4(),
  organization_name TEXT NOT NULL,
  CONSTRAINT organization_id_pk PRIMARY KEY (organization_id)
);

CREATE TABLE IF NOT EXISTS job (
  job_id UUID DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  job_title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT job_id_pk PRIMARY KEY (job_id),
  CONSTRAINT organization_id_fk FOREIGN KEY (organization_id) REFERENCES organization(organization_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_requirement (
  job_requirement_id UUID DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  job_id UUID NOT NULL,
  requirement_label TEXT NOT NULL,
  icon TEXT DEFAULT NULL,
  minimal_score DECIMAL DEFAULT NULL,
  CONSTRAINT job_requirement_id_pk PRIMARY KEY (job_requirement_id),
  CONSTRAINT job_id_fk FOREIGN KEY (job_id) REFERENCES job(job_id) ON DELETE CASCADE,
  CONSTRAINT organization_id_fk FOREIGN KEY (organization_id) REFERENCES organization(organization_id) ON DELETE CASCADE
);

CREATE TYPE FORM_CATEGORY AS ENUM ('application', 'screening', 'assessment');
CREATE TABLE IF NOT EXISTS form (
  form_id UUID DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  job_id UUID NOT NULL,
  form_category FORM_CATEGORY NOT NULL,
  form_title TEXT DEFAULT NULL,
  CONSTRAINT form_id_pk PRIMARY KEY (form_id),
  CONSTRAINT organization_id_fk FOREIGN KEY (organization_id) REFERENCES organization(organization_id) ON DELETE CASCADE,
  CONSTRAINT job_id_fk FOREIGN KEY (job_id) REFERENCES job(job_id) ON DELETE CASCADE,
  CONSTRAINT form_title_assessment_form_not_null CHECK(form_title IS NOT NULL OR form_category != 'assessment')
);

CREATE TYPE form_component AS ENUM ('input','date_picker', 'textarea', 'select', 'radio', 'checkbox', 'file_upload', 'rating_group');
CREATE TABLE IF NOT EXISTS form_item (
  form_item_id UUID DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  job_requirement_id UUID DEFAULT NULL,
  component FORM_COMPONENT NOT NULL,
  row_index INTEGER NOT NULL,
  label TEXT NOT NULL,
  placeholder TEXT,
  description TEXT,
  default_value TEXT,
  validation JSONB,    -- validation object for form item
  options JSONB,       -- array of options if componen is select, radio, etc.
  editable BOOLEAN DEFAULT FALSE,
  deletable BOOLEAN DEFAULT FALSE,
  CONSTRAINT form_item_id_pk PRIMARY KEY (form_item_id),
  CONSTRAINT form_id_fk FOREIGN KEY (form_id) REFERENCES form(form_id) ON DELETE CASCADE,
  CONSTRAINT organization_id_fk FOREIGN KEY (organization_id) REFERENCES organization(organization_id) ON DELETE CASCADE,
  CONSTRAINT job_requirement_id_fk FOREIGN KEY (job_requirement_id) REFERENCES job_requirement(job_requirement_id) ON DELETE NO ACTION DEFERRABLE,
  CONSTRAINT row_index_check CHECK (row_index >= 0),
  CONSTRAINT form_id_row_index_unique UNIQUE (form_id, row_index), -- make shure the index inside of the form is unique
  CONSTRAINT options_conditional_not_null CHECK(
    NOT (component='select' OR component='radio' OR component='rating_group' OR component='checkbox')
    OR options IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS applicant (
  applicant_id UUID DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  job_id UUID NOT NULL,
  attributes JSONB NOT NULL, -- {label, value}
  files JSONB,               -- {label, url}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT applicant_id_pk PRIMARY KEY (applicant_id),
  CONSTRAINT organization_id_fk FOREIGN KEY (organization_id) REFERENCES organization(organization_id) ON DELETE CASCADE,
  CONSTRAINT job_id_id FOREIGN KEY (job_id) REFERENCES job(job_id) ON DELETE CASCADE
);

-- Submission of screening or ac form
CREATE TABLE IF NOT EXISTS form_submission (
  applicant_id UUID,
  submitter_id TEXT, -- id of submitting user
  form_id UUID,
  organization_id UUID NOT NULL,
  submission JSONB NOT NULL, -- {form_item_id,value}
  comment TEXT,
  CONSTRAINT applicant_id_submitter_id_form_id_pk PRIMARY KEY (applicant_id, submitter_id, form_id),
  CONSTRAINT form_id_fk FOREIGN KEY (form_id) REFERENCES form(form_id) ON DELETE CASCADE,
  CONSTRAINT applicant_id FOREIGN KEY (applicant_id) REFERENCES applicant(applicant_id) ON DELETE CASCADE,
  CONSTRAINT organization_id_fk FOREIGN KEY (organization_id) REFERENCES organization(organization_id) ON DELETE CASCADE
);

