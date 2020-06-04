import pgPromise from 'pg-promise';
import dotenv from 'dotenv';

dotenv.config();

const pgp = pgPromise({capSQL: true});

const dbURL = () => {
  switch (process.env.NODE_ENV) {
    case 'testing':
      return process.env.TEST_DB_URL;
    default:
      return process.env.DEV_DB_URL;
  }
};
const db = pgp(dbURL() || '');

export default db;
