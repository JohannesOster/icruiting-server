import dotenv from 'dotenv';

dotenv.config();

type Environment = 'production' | 'development' | 'test' | 'staging';

const dbChangelogFile = '/src/infrastructure/db/migrations/changelog.xml';
const config = {
  staging: {
    url: process.env.STAGING_DB_URL || '',
    liquibase: {
      url: `jdbc:${process.env.LIQUIBASE_STAGING_DB_URL}`,
      username: `${process.env.LIQUIBASE_STAGING_DB_USERNAME}`,
      password: `${process.env.LIQUIBASE_STAGING_DB_PASSWORD}`,
      changeLogFile: dbChangelogFile,
    },
  },
  production: {
    url: process.env.DATABASE_URL || '',
    liquibase: {
      url: `jdbc:${process.env.LIQUIBASE_PROD_DB_URL}`,
      username: `${process.env.LIQUIBASE_PROD_DB_USER}`,
      password: `${process.env.LIQUIBASE_PROD_DB_PASSWORD}`,
      changeLogFile: dbChangelogFile,
    },
  },
  development: {
    url: process.env.DEV_DB_URL || '',
    liquibase: {
      url: `jdbc:${process.env.LIQUIBASE_DEV_DB_URL}`,
      username: `${process.env.LIQUIBASE_DEV_DB_USERNAME}`,
      password: `${process.env.LIQUIBASE_DEV_DB_PASSWORD}`,
      changeLogFile: dbChangelogFile,
    },
  },
  test: {
    url: process.env.TEST_DB_URL || '',
    liquibase: {
      url: `jdbc:${process.env.LIQUIBASE_TEST_DB_URL}`,
      username: `${process.env.LIQUIBASE_TEST_DB_USERNAME}`,
      password: `${process.env.LIQUIBASE_TEST_DB_PASSWORD}`,
      changeLogFile: dbChangelogFile,
    },
  },
};

export const configForEnv = () => {
  const defaultConfig = config.development;
  const env = process.env.NODE_ENV;
  if (!env) return defaultConfig;
  return config[env as Environment] || defaultConfig;
};
