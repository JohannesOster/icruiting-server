import pgPromise from 'pg-promise';
import dotenv from 'dotenv';

dotenv.config();

const pgp = pgPromise({capSQL: true});
const db = pgp(process.env.DB_URL || 'clear');

export default db;
