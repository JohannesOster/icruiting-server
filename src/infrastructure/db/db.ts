import pgPromise, {IInitOptions} from 'pg-promise';
import config from '../../config';
import humps from 'humps';

const initOptions: IInitOptions = {
  receive(e) {
    if (!e.result) return e.result;
    e.result.rows = e.data.map((obj) => humps.camelizeKeys(obj));
  },
};

const pgp = pgPromise(initOptions);
const db = pgp(config.get('db.url'));

export {db, pgp};
