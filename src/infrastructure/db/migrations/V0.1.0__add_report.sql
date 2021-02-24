CREATE TABLE IF NOT EXISTS report (
  report_id UUID DEFAULT uuid_generate_v4(),
  tenant_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT report_id_pk PRIMARY KEY (report_id),
  CONSTRAINT tenant_id_fk FOREIGN KEY (tenant_id) REFERENCES tenant(tenant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS report_field (
  report_id UUID DEFAULT uuid_generate_v4(),
  form_field_id UUID, 
  CONSTRAINT report_id_form_field_id_pk PRIMARY KEY (report_id,form_field_id),
  CONSTRAINT report_id FOREIGN KEY (report_id) REFERENCES report(report_id) ON DELETE CASCADE,
  CONSTRAINT form_field_id FOREIGN KEY (form_field_id) REFERENCES form_field(form_field_id) ON DELETE CASCADE
);

