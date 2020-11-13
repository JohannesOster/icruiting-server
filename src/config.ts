type Environment = 'production' | 'development' | 'test';

const config = {
  production: {
    baseURL: 'https://icruiting.herokuapp.com',
    freeStripeProducId: 'prod_INnhF3X9Yvijfx', // used to filter free plan
  },
  development: {
    baseURL: 'http://localhost:5000',
    freeStripeProducId: 'prod_INnqsrNBN4yq8x',
  },
  test: {baseURL: 'http://localhost:5000', freeStripeProducId: ''},
};

const configForEnv = () => {
  const defaultConfig = config.development;
  const env = process.env.NODE_ENV;
  if (!env) return defaultConfig;
  return config[env as Environment] || defaultConfig;
};

export default configForEnv();
