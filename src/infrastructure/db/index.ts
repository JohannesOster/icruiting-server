import pgPromise from 'pg-promise';
import {IInitOptions, IDatabase, IMain} from 'pg-promise';
import config from './config';
import humps from 'humps';

export interface DBAccess {
  db: IDatabase<any>;
  pgp: IMain;
}

const initOptions: IInitOptions = {
  receive(data, result) {
    if (!result) return result;
    result.rows = data.map((obj) => humps.camelizeKeys(obj));
  },
};

const pgp = pgPromise(initOptions);
const db = pgp(config.url);

export {db as default, pgp};
