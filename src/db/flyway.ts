import {exec} from 'child_process';
import config from './config';

const args = Object.entries(config.flyway || {})
  .reduce((acc, [key, value]) => acc + ` -${key}=${value}`, '')
  .trim();

const execute = (command: string) => {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err || stderr) return reject(err || stderr);
      resolve(stdout);
    });
  });
};

export const flyway = (command: string) => execute(`flyway ${command} ${args}`);

require('make-runnable');
