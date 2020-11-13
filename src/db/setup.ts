import db from '.';
import {flyway} from './flyway';

export const createAll = async () => flyway('migrate');
export const dropAll = async () => flyway('clean');
export const endConnection = () => db.$pool.end();
export const truncateAllTables = () => db.any('TRUNCATE tenant CASCADE;');
