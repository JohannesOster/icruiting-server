import config from './config';
import {LiquibaseConfig, Liquibase, POSTGRESQL_DEFAULT_CONFIG} from 'liquibase';

const liquibaseConfig: LiquibaseConfig = {
  ...POSTGRESQL_DEFAULT_CONFIG,
  ...config.liquibase,
};
const instance = new Liquibase(liquibaseConfig);

export const dbMigrate = (command: string) => {
  switch (command) {
    case 'update':
      return instance.update({});
    case 'drop-all':
      return instance.dropAll();
    default:
      throw new Error(`Unknown command: ${command}`);
  }
};

require('make-runnable');
