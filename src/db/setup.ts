import db from '.';
import {exec} from 'child_process';

const config = {
  url: 'jdbc:postgresql://localhost:5432/icruiting-test',
  user: 'oster',
  password: '',
  locations: 'filesystem:src/db/migrations',
};

const buildArgs = () => {
  Object.entries(config).reduce(
    (acc, [key, value]) => acc + ` -${key}=${value}`,
    '',
  );
};

export const createAll = async () => {
  return new Promise((resolve, reject) => {
    const command = 'flyway migrate' + buildArgs();
    exec(command, (err, stdout, stderr) => {
      if (err || stderr) return reject(err || stderr);
      resolve(stdout);
    });
  });
};

export const dropAll = async () => {
  return new Promise((resolve, reject) => {
    const command = 'flyway clean' + buildArgs();

    exec(command, (err, stdout, stderr) => {
      if (err || stderr) return reject(err || stderr);
      resolve(stdout);
    });
  });
};
export const endConnection = () => db.$pool.end();
export const truncateAllTables = () => db.any('TRUNCATE tenant CASCADE;');

require('make-runnable');

export const rawText = (text: string) => ({
  toPostgres: () => text,
  rawType: true,
});
