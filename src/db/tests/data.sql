INSERT INTO tenant(tenant_id,tenant_name) VALUES
	('2efca84e-cc44-47cd-a03a-c91630af95e9','d7dcf9b6-30dc-4202-93b2-fba0af3b6307');
INSERT INTO job(tenant_id,job_id,job_title) VALUES
	('2efca84e-cc44-47cd-a03a-c91630af95e9','a3ca4d1c-8df6-46d2-8963-98236c3c4a67','Small Soft Chicken');
INSERT INTO job_requirement(job_requirement_id,job_id,requirement_label,min_value) VALUES
	('de3b771a-5a11-43d8-a1d2-a70db5991f7c','a3ca4d1c-8df6-46d2-8963-98236c3c4a67','Intelligent Plastic Salad Borders Planner','72597'),
	('e630a9c2-0624-4eee-9b5c-17297ba77c83','a3ca4d1c-8df6-46d2-8963-98236c3c4a67','Branding Configuration initiative','49184');
INSERT INTO form(form_id,tenant_id,job_id,form_category) VALUES
	('8d7d3ee6-8b00-49d3-8997-7ab0da28171f','2efca84e-cc44-47cd-a03a-c91630af95e9','a3ca4d1c-8df6-46d2-8963-98236c3c4a67','screening');
INSERT INTO form_field(form_field_id,form_id,intent,component,row_index,label,description,default_value,options,required) VALUES
	('6dea55f7-4b2c-47d2-817e-701d58d022e5','8d7d3ee6-8b00-49d3-8997-7ab0da28171f','sum_up','rating_group','0','value-added Netherlands Antillian Guilder Personal Loan Account','Home Loan Account multi-state','0','[{"label":"0","value":"0"},{"label":"1","value":"1"},{"label":"2","value":"2"}]','true');
