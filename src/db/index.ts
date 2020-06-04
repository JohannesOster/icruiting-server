import pgPromise from 'pg-promise';
import dotenv from 'dotenv';

dotenv.config();

const pgp = pgPromise({capSQL: true});

const dbURL = () => {
  switch (process.env.NODE_ENV) {
    case 'development':
      console.log('Running development database');
      return process.env.DEV_DB_URL;
    default:
      console.log('Running testing database');
      return process.env.TEST_DB_URL;
  }
};
const db = pgp(dbURL() || '');

export default db;
