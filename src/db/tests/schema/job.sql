BEGIN; 
SELECT plan(12);

SELECT columns_are('job', ARRAY['job_id', 'tenant_id', 'job_title', 'created_at']);

SELECT col_type_is('job', 'job_id', 'uuid', 'job_id column type is uuid');
SELECT col_default_is('job', 'job_id', 'uuid_generate_v4()', 'job_id column type has default uuid_generate_v4()');
SELECT col_is_pk('job', 'job_id', 'job_id column has primary key constraint');

SELECT col_type_is('job', 'tenant_id', 'uuid', 'tenant_id column type is uuid');
SELECT col_not_null('job', 'tenant_id', 'tenant_id column has not null constraint');
SELECT col_is_fk('job', 'tenant_id', 'tenant_id column has foreign key constraint');

SELECT col_type_is('job', 'job_title', 'text', 'job_title column type is text');
SELECT col_not_null('job', 'job_title', 'job_title column has not null constraint');

SELECT col_type_is('job', 'created_at', 'timestamp with time zone', 'created_at column type is text');
SELECT col_default_is('job', 'created_at', 'now()', 'created_at colum has default now()');
SELECT col_not_null('job', 'created_at', 'created_at column has not null constraint');

SELECT * FROM finish();
ROLLBACK; 
