CREATE TABLE IF NOT EXISTS report_field (
  tenant_id UUID,
  job_id UUID,
  form_field_id UUID, 
  CONSTRAINT job_id_form_field_id_pk PRIMARY KEY (job_id,form_field_id),
  CONSTRAINT tenant_id_fk FOREIGN KEY (tenant_id) REFERENCES tenant(tenant_id) ON DELETE CASCADE,
  CONSTRAINT job_id_fk FOREIGN KEY (job_id) REFERENCES job(job_id) ON DELETE CASCADE,
  CONSTRAINT form_field_id FOREIGN KEY (form_field_id) REFERENCES form_field(form_field_id) ON DELETE CASCADE
);

