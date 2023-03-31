// PM2 configuration file
export const apps = [
  {
    script: 'dist/index.js',
    watch: ['dist'],
    env: {NODE_ENV: 'development'},
    env_production: {NODE_ENV: 'production', NODE_PATH: 'dist/'},
  },
];
