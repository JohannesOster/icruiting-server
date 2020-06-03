CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS organization (
  organization_id uuid DEFAULT uuid_generate_v4(),
  organization_name TEXT NOT NULL,
  CONSTRAINT organization_id_pk PRIMARY KEY (organization_id)
);

CREATE TABLE IF NOT EXISTS job (
  job_id UUID DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  job_title TEXT NOT NULL,
  CONSTRAINT job_id_pk PRIMARY KEY (job_id),
  CONSTRAINT organization_id_fk FOREIGN KEY (organization_id) REFERENCES organization(organization_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_requirement (
  job_requirement_id UUID DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL,
  requirement_label TEXT NOT NULL,
  CONSTRAINT job_requirement_id_pk PRIMARY KEY (job_requirement_id),
  CONSTRAINT job_id_fk FOREIGN KEY (job_id) REFERENCES job(job_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS form (
  form_id UUID DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  job_id UUID NOT NULL,
  form_category TEXT NOT NULL,
  CONSTRAINT form_id_pk PRIMARY KEY (form_id),
  CONSTRAINT organization_id_fk FOREIGN KEY (organization_id) REFERENCES organization(organization_id) ON DELETE CASCADE,
  CONSTRAINT job_id_fk FOREIGN KEY (job_id) REFERENCES job(job_id) ON DELETE CASCADE,
  CONSTRAINT form_category_check CHECK (
    form_category = 'APPLICATION'
    OR form_category = 'SCREENING'
    OR form_category = 'ASSESSMENT'
  )
);

-- ================= FORM ITEMS
CREATE TABLE IF NOT EXISTS form_item (
  form_item_id UUID DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL,
  item_label TEXT NOT NULL,
  item_name TEXT NOT NULL,
  form_index INTEGER NOT NULL,
  CONSTRAINT form_item_id_pk PRIMARY KEY (form_item_id),
  CONSTRAINT form_id_fk FOREIGN KEY (form_id) REFERENCES form(form_id) ON DELETE CASCADE,
  CONSTRAINT form_index_check CHECK (form_index >= 0)
);

CREATE TABLE IF NOT EXISTS textfield (
  textfield_id UUID DEFAULT uuid_generate_v4(),
  form_item_id UUID NOT NULL,
  CONSTRAINT textfield_id_pk PRIMARY KEY (textfield_id),
  CONSTRAINT form_item_id_fk FOREIGN KEY (form_item_id) REFERENCES form_item(form_item_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS textarea (
  textarea_id UUID DEFAULT uuid_generate_v4(),
  form_item_id UUID NOT NULL,
  CONSTRAINT textarea_id_pk PRIMARY KEY (textarea_id),
  CONSTRAINT form_item_id_fk FOREIGN KEY (form_item_id) REFERENCES form_item(form_item_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS file_upload_field (
  file_upload_field_id UUID DEFAULT uuid_generate_v4(),
  form_item_id UUID NOT NULL,
  CONSTRAINT file_upload_field_id_pk PRIMARY KEY (file_upload_field_id),
  CONSTRAINT form_item_id_fk FOREIGN KEY (form_item_id) REFERENCES form_item(form_item_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS select_field (
  select_field_id UUID DEFAULT uuid_generate_v4(),
  form_item_id UUID NOT NULL,
  CONSTRAINT select_field_id_pk PRIMARY KEY (select_field_id),
  CONSTRAINT form_item_id_fk FOREIGN KEY (form_item_id) REFERENCES form_item(form_item_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS select_field_option (
  select_field_option_id UUID DEFAULT uuid_generate_v4(),
  select_field_id UUID NOT NULL,
  option_label TEXT NOT NULL,
  option_value TEXT NOT NULL,
  CONSTRAINT select_field_option_id_pk PRIMARY KEY (select_field_option_id),
  CONSTRAINT select_field_id_fk FOREIGN KEY (select_field_id) REFERENCES select_field(select_field_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS radio_group (
  radio_group_id UUID DEFAULT uuid_generate_v4(),
  form_item_id UUID NOT NULL,
  CONSTRAINT radio_group_id_pk PRIMARY KEY (radio_group_id),
  CONSTRAINT form_item_id_fk FOREIGN KEY (form_item_id) REFERENCES form_item(form_item_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS radio_group_option (
  radio_group_option_id UUID DEFAULT uuid_generate_v4(),
  radio_group_id UUID NOT NULL,
  option_label TEXT NOT NULL,
  option_value TEXT NOT NULL,
  CONSTRAINT radio_group_option_id_pk PRIMARY KEY (radio_group_option_id),
  CONSTRAINT radio_group_id_fk FOREIGN KEY (radio_group_id) REFERENCES radio_group(radio_group_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS checkbox_group (
  checkbox_group_id UUID DEFAULT uuid_generate_v4(),
  form_item_id UUID NOT NULL,
  CONSTRAINT checkbox_group_id_pk PRIMARY KEY (checkbox_group_id),
  CONSTRAINT form_item_id_fk FOREIGN KEY (form_item_id) REFERENCES form_item(form_item_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS checkbox_group_option (
  checkbox_group_option_id UUID DEFAULT uuid_generate_v4(),
  checkbox_group_id UUID NOT NULL,
  option_label TEXT NOT NULL,
  option_value TEXT NOT NULL,
  CONSTRAINT checkbox_group_option_id_pk PRIMARY KEY (checkbox_group_option_id),
  CONSTRAINT checkbox_group_id_fk FOREIGN KEY (checkbox_group_id) REFERENCES checkbox_group(checkbox_group_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rating_group (
  rating_group_id UUID DEFAULT uuid_generate_v4(),
  form_item_id UUID NOT NULL,
  CONSTRAINT rating_group_id_pk PRIMARY KEY (rating_group_id),
  CONSTRAINT form_item_id_fk FOREIGN KEY (form_item_id) REFERENCES form_item(form_item_id) ON DELETE CASCADE
);