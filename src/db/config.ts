import dotenv from 'dotenv';

dotenv.config();

type Environment = 'production' | 'development' | 'test';

const config = {
  production: {url: process.env.DATABASE_URL || '', flyway: {}},
  development: {
    url: process.env.DEV_DB_URL || '',
    flyway: {
      url: 'jdbc:postgresql://localhost:5432/icruiting-dev',
      user: 'oster',
      password: '',
      locations: 'filesystem:src/db/migrations',
    },
  },
  test: {
    url: process.env.TEST_DB_URL || '',
    flyway: {
      url: 'jdbc:postgresql://localhost:5432/icruiting-test',
      user: 'oster',
      password: '',
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
