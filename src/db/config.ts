import dotenv from 'dotenv';

dotenv.config();

type Environment = 'production' | 'development' | 'test';

const config = {
  production: {url: process.env.DATABASE_URL || ''},
  development: {url: process.env.DEV_DB_URL || ''},
  test: {url: process.env.TEST_DB_URL || ''},
};

const configForEnv = () => {
  const defaultConfig = config.development;
  const env = process.env.NODE_ENV;
  if (!env) return defaultConfig;
  return config[env as Environment] || defaultConfig;
};

export default configForEnv();
