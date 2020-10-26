INSERT INTO tenant(tenant_id,tenant_name) VALUES
	('b074a1f6-a792-4cac-a61a-89a5301d0e6c','3387c146-062e-4dff-9ed1-16e41d24018f');
INSERT INTO job(tenant_id,job_id,job_title) VALUES
	('b074a1f6-a792-4cac-a61a-89a5301d0e6c','e818a9ae-48cb-4c5c-a592-7e34ce2f1b07','Toys');
INSERT INTO job_requirement(job_requirement_id,job_id,requirement_label,min_value) VALUES
	('418f6c42-137a-4821-8500-84b43ce299d7','e818a9ae-48cb-4c5c-a592-7e34ce2f1b07','copying Alley Spring','29712'),
	('d70234f5-ef02-4c3f-9068-bcf5841ebd8c','e818a9ae-48cb-4c5c-a592-7e34ce2f1b07','Refined Borders','66168');
INSERT INTO form(form_id,tenant_id,job_id,form_category) VALUES
	('242babb6-871a-4a7a-8aaf-3c711b39de54','b074a1f6-a792-4cac-a61a-89a5301d0e6c','e818a9ae-48cb-4c5c-a592-7e34ce2f1b07','screening'),
	('ba9aa20b-fc70-467d-9c9c-1cae2d14ab89','b074a1f6-a792-4cac-a61a-89a5301d0e6c','e818a9ae-48cb-4c5c-a592-7e34ce2f1b07','screening');
INSERT INTO form_field(form_field_id,form_id,intent,component,row_index,label,description,default_value,options,required) VALUES
	('65ca63e7-27f7-4448-a592-8c9d628e53e9','242babb6-871a-4a7a-8aaf-3c711b39de54','sum_up','rating_group','0','synthesizing PNG','Tools Soap','0','[{"label":"0","value":"0"},{"label":"1","value":"1"},{"label":"2","value":"2"}]','true');
INSERT INTO form_field(form_field_id,form_id,component,row_index,label,description,required) VALUES
	('b5f60bc5-3d2a-4115-ae97-6b53979fd7f5','ba9aa20b-fc70-467d-9c9c-1cae2d14ab89','input','0','Bolivar Fuerte cyan Strategist','New York Health','true');
INSERT INTO applicant(tenant_id,job_id,applicant_id) VALUES
	('b074a1f6-a792-4cac-a61a-89a5301d0e6c','e818a9ae-48cb-4c5c-a592-7e34ce2f1b07','e42c6897-fc5f-470c-ba8f-3d58afc15e97');
INSERT INTO applicant_attribute(applicant_id,form_field_id,attribute_value) VALUES
	('e42c6897-fc5f-470c-ba8f-3d58afc15e97','b5f60bc5-3d2a-4115-ae97-6b53979fd7f5','e-commerce Small withdrawal');
