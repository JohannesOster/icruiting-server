ifneq (,$(wildcard ./.env))
    include .env
    export
endif

SQL_DIR = ../sql

setup: $(SQL_DIR)/createTables.sql $(SQL_DIR)/createViews.sql $(SQL_DIR)/createFunctions.sql
			 psql -U ${TEST_PG_USERNAME} -d ${TEST_PG_DB_NAME} < $(SQL_DIR)/createTables.sql
			 psql -U ${TEST_PG_USERNAME} -d ${TEST_PG_DB_NAME} < $(SQL_DIR)/createViews.sql 
			 psql -U ${TEST_PG_USERNAME} -d ${TEST_PG_DB_NAME} < $(SQL_DIR)/createFunctions.sql 

drop: $(SQL_DIR)/dropTables.sql $(SQL_DIR)/dropViews.sql $(SQL_DIR)/dropFunctions.sql
			 psql -U ${TEST_PG_USERNAME} -d ${TEST_PG_DB_NAME} < $(SQL_DIR)/dropFunctions.sql
			 psql -U ${TEST_PG_USERNAME} -d ${TEST_PG_DB_NAME} < $(SQL_DIR)/dropViews.sql
			 psql -U ${TEST_PG_USERNAME} -d ${TEST_PG_DB_NAME} < $(SQL_DIR)/dropTables.sql

test: ./**/*.sql
	 		pg_prove -U ${TEST_PG_USERNAME} -d ${TEST_PG_DB_NAME} $^
