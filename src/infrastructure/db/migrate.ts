import {LiquibaseConfig, Liquibase, POSTGRESQL_DEFAULT_CONFIG, LiquibaseLogLevels} from 'liquibase';
import config from '../../config';

const liquibaseConfig: LiquibaseConfig = {
  ...POSTGRESQL_DEFAULT_CONFIG,
  url: `jdbc:${config.get('liquibase.url')}`,
  username: config.get('liquibase.username'),
  password: config.get('liquibase.password'),
  changeLogFile: config.get('liquibase.changeLogFile'),
  logLevel: config.get('liquibase.logLevel') as LiquibaseLogLevels,
};
const instance = new Liquibase(liquibaseConfig);

export const dbMigrate = (command: string) => {
  switch (command) {
    case 'update':
      return instance.update({});
    case 'drop-all':
      return instance.dropAll();
    case 'changelogSync':
      return instance.changelogSync();
    default:
      throw new Error(`Unknown command: ${command}`);
  }
};

require('make-runnable');
