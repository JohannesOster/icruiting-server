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
const db = pgp({
  connectionString: config.get('db.url'),
  ssl: config.get('env') === 'production' ? {rejectUnauthorized: false} : false,
});

export {db, pgp};
