import db from '.';
import {dbMigrate} from './migrate';

export const createAll = async () => dbMigrate('update');
export const dropAll = async () => dbMigrate('drop-all');
export const endConnection = () => db.$pool.end();
export const truncateAllTables = () => db.any('TRUNCATE tenant CASCADE;');
