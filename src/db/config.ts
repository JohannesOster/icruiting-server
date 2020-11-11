import dotenv from 'dotenv';

dotenv.config();

type Environment = 'production' | 'development' | 'test';

const config = {
  production: {
    url: process.env.DATABASE_URL || '',
    flyway: {
      url: `jdbc:${process.env.FLYWAY_PROD_DB_URL}`,
      user: process.env.FLYWAY_PROD_DB_USER,
      password: process.env.FLYWAY_PROD_DB_PASSWORD,
      locations: 'filesystem:src/db/migrations',
    },
  },
  development: {
    url: process.env.DEV_DB_URL || '',
    flyway: {
      url: `jdbc:${process.env.FLYWAY_DEV_DB_URL}`,
      user: process.env.FLYWAY_DEV_DB_USER,
      password: process.env.FLYWAY_DEV_DB_PASSWORD,
      locations: 'filesystem:src/db/migrations',
    },
  },
  test: {
    url: process.env.TEST_DB_URL || '',
    flyway: {
      url: `jdbc:${process.env.FLYWAY_TEST_DB_URL}`,
      user: process.env.FLYWAY_TEST_DB_USER,
      password: process.env.FLYWAY_TEST_DB_PASSWORD,
      locations: 'filesystem:src/db/migrations',
    },
  },
};

const configForEnv = () => {
  const defaultConfig = config.development;
  const env = process.env.NODE_ENV;
  if (!env) return defaultConfig;
  return config[env as Environment] || defaultConfig;
};

export default configForEnv();
