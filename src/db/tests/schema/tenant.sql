BEGIN; 
SELECT plan(10);

-- Columns
SELECT columns_are('tenant', ARRAY['tenant_id', 'tenant_name', 'created_at']);
SELECT col_type_is('tenant', 'tenant_id', 'uuid', 'tenant_id column type is uuid');
SELECT col_default_is('tenant', 'tenant_id', 'uuid_generate_v4()', 'tenant_id column type has default uuid_generate_v4()');

SELECT col_type_is('tenant', 'tenant_name', 'text', 'tenant_name column type is text');
SELECT col_not_null('tenant', 'tenant_name', 'tenant_name column has not null constraint');

SELECT col_type_is('tenant', 'created_at', 'timestamp with time zone', 'created_at column type is text');
SELECT col_default_is('tenant', 'created_at', 'now()', 'created_at colum has default now()');
SELECT col_not_null('tenant', 'created_at', 'created_at column has not null constraint');

-- Keys
SELECT has_pk('tenant', 'Has a Primary Key');
SELECT col_is_pk('tenant', 'tenant_id', 'tenant_id is Primary Key');


SELECT * FROM finish();
ROLLBACK; 