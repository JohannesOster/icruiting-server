CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS tenant (
  tenantId UUID DEFAULT uuid_generate_v4(),
  tenantName TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tenantId_pk PRIMARY KEY (tenantId)
);

CREATE TABLE IF NOT EXISTS job (
  jobId UUID DEFAULT uuid_generate_v4(),
  tenantId UUID NOT NULL,
  jobTitle TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT jobId_pk PRIMARY KEY (jobId),
  CONSTRAINT tenantId_fk FOREIGN KEY (tenantId) REFERENCES tenant(tenantId) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_requirement (
  jobRequirementId UUID DEFAULT uuid_generate_v4(),
  tenantId UUID NOT NULL,
  jobId UUID NOT NULL,
  requirementLabel TEXT NOT NULL,
  CONSTRAINT jobRequirementId_pk PRIMARY KEY (jobRequirementId),
  CONSTRAINT jobId_fk FOREIGN KEY (jobId) REFERENCES job(jobId) ON DELETE CASCADE,
  CONSTRAINT tenantId_fk FOREIGN KEY (tenantId) REFERENCES tenant(tenantId) ON DELETE CASCADE
);

CREATE TYPE formCategory AS ENUM ('application', 'screening', 'assessment');
CREATE TABLE IF NOT EXISTS form (
  formId UUID DEFAULT uuid_generate_v4(),
  tenantId UUID NOT NULL,
  jobId UUID NOT NULL,
  formCategory formCategory NOT NULL,
  formTitle TEXT DEFAULT NULL,
  CONSTRAINT formId_pk PRIMARY KEY (formId),
  CONSTRAINT tenantId_fk FOREIGN KEY (tenantId) REFERENCES tenant(tenantId) ON DELETE CASCADE,
  CONSTRAINT jobId_fk FOREIGN KEY (jobId) REFERENCES job(jobId) ON DELETE CASCADE,
  CONSTRAINT formTitle_assessment_form_not_null CHECK(formTitle IS NOT NULL OR formCategory != 'assessment')
);

CREATE TYPE form_field_intent AS ENUM ('aggregate', 'count_distinct', 'sum_up');
CREATE TYPE form_field_component AS ENUM ('input','date_picker', 'textarea', 'select', 'radio', 'checkbox', 'file_upload', 'rating_group');
CREATE TABLE IF NOT EXISTS form_field (
  formFieldId UUID DEFAULT uuid_generate_v4(),
  formId UUID NOT NULL,
  tenantId UUID NOT NULL,
  jobRequirementId UUID DEFAULT NULL,
  intent form_field_intent DEFAULT NULL,
  component form_field_component NOT NULL,
  rowIndex INTEGER NOT NULL,
  label TEXT NOT NULL,
  placeholder TEXT,
  description TEXT,
  defaultValue TEXT,
  required BOOLEAN DEFAULT FALSE,
  options JSONB,       -- array of options if componen is select, radio, etc.
  props JSONB, -- additional props
  editable BOOLEAN DEFAULT FALSE,
  deletable BOOLEAN DEFAULT FALSE,
  CONSTRAINT formFieldId_pk PRIMARY KEY (formFieldId),
  CONSTRAINT formId_fk FOREIGN KEY (formId) REFERENCES form(formId) ON DELETE CASCADE,
  CONSTRAINT tenantId_fk FOREIGN KEY (tenantId) REFERENCES tenant(tenantId) ON DELETE CASCADE,
  CONSTRAINT jobRequirementId_fk FOREIGN KEY (jobRequirementId) REFERENCES job_requirement(jobRequirementId) ON DELETE NO ACTION DEFERRABLE,
  CONSTRAINT rowIndex_check CHECK (rowIndex >= 0),
  CONSTRAINT formId_rowIndex_unique UNIQUE (formId, rowIndex) DEFERRABLE, -- make shure the index inside of the form is unique
  CONSTRAINT options_conditional_not_null CHECK(
    NOT (component='select' OR component='radio' OR component='rating_group' OR component='checkbox')
    OR options IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS applicant (
  applicantId UUID DEFAULT uuid_generate_v4(),
  tenantId UUID NOT NULL,
  jobId UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT applicantId_pk PRIMARY KEY (applicantId),
  CONSTRAINT tenantId_fk FOREIGN KEY (tenantId) REFERENCES tenant(tenantId) ON DELETE CASCADE,
  CONSTRAINT jobId_id FOREIGN KEY (jobId) REFERENCES job(jobId) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS applicantAttribute (
  applicantId UUID NOT NULL,
  formFieldId UUID NOT NULL,
  attributeValue TEXT,
  CONSTRAINT applicantId_form_item_id_pk PRIMARY KEY (applicantId, formFieldId),
  CONSTRAINT applicantId_fk FOREIGN KEY (applicantId) REFERENCES applicant(applicantId) ON DELETE CASCADE,
  CONSTRAINT formFieldId_fk FOREIGN KEY (formFieldId) REFERENCES form_field(formFieldId) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS form_submission (
  formSubmissionId UUID DEFAULT uuid_generate_v4(),
  applicantId UUID NOT NULL,
  submitterId TEXT NOT NULL, -- id of submitting user
  formId UUID NOT NULL,
  tenantId UUID NOT NULL,
  CONSTRAINT formSubmissionId_pk PRIMARY KEY (formSubmissionId),
  CONSTRAINT formId_fk FOREIGN KEY (formId) REFERENCES form(formId) ON DELETE CASCADE,
  CONSTRAINT applicantId FOREIGN KEY (applicantId) REFERENCES applicant(applicantId) ON DELETE CASCADE,
  CONSTRAINT tenantId_fk FOREIGN KEY (tenantId) REFERENCES tenant(tenantId) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS form_submission_field (
  formSubmissionId UUID,
  formFieldId UUID,
  submission_value TEXT,
  CONSTRAINT formSubmissionId_formFieldId_pk PRIMARY KEY (formSubmissionId,formFieldId),
  CONSTRAINT formSubmissionId FOREIGN KEY (formSubmissionId) REFERENCES form_submission(formSubmissionId) ON DELETE CASCADE,
  CONSTRAINT formFieldId FOREIGN KEY (formFieldId) REFERENCES form_field(formFieldId) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS applicant_report (
  applicantReportId UUID DEFAULT uuid_generate_v4(),
  tenantId UUID NOT NULL,
  jobId UUID NOT NULL,
  image UUID DEFAULT NULL,
  CONSTRAINT applicantReportId_pk PRIMARY KEY (applicantReportId),
  CONSTRAINT tenantId_fk FOREIGN KEY (tenantId) REFERENCES tenant(tenantId) ON DELETE CASCADE,
  CONSTRAINT jobId_fk FOREIGN KEY (jobId) REFERENCES job(jobId) ON DELETE CASCADE,
  CONSTRAINT image_fk FOREIGN KEY (image) REFERENCES form_field(formFieldId) ON DELETE CASCADE,
  CONSTRAINT tenantId_jobId_uq UNIQUE (tenantId, jobId)
);

CREATE TABLE IF NOT EXISTS applicant_report_field (
  applicantReportId UUID,
  formFieldId UUID,
  CONSTRAINT applicantReportId_formFieldId_pk PRIMARY KEY (applicantReportId, formFieldId),
  CONSTRAINT applicantReportId_fk FOREIGN KEY (applicantReportId) REFERENCES applicant_report(applicantReportId) ON DELETE CASCADE,
  CONSTRAINT formFieldId_fk FOREIGN KEY (formFieldId) REFERENCES form_field(formFieldId) ON DELETE CASCADE
);
