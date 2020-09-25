type Environment = 'production' | 'development' | 'test';

const config = {
  production: {baseURL: 'https://icruiting.herokuapp.com'},
  development: {baseURL: 'http://localhost:5000'},
  test: {baseURL: 'http://localhost:5000'},
};

const configForEnv = () => {
  const defaultConfig = config.development;
  const env = process.env.NODE_ENV;
  if (!env) return defaultConfig;
  return config[env as Environment] || defaultConfig;
};

export default configForEnv();
