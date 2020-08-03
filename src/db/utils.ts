import db from '.';
import {createTables, dropTables, truncateAll} from './sql';

export const createAllTables = () => db.any(createTables);
export const dropAllTables = () => db.any(dropTables);
export const endConnection = () => db.$pool.end();
export const truncateAllTables = () => db.any(truncateAll);

require('make-runnable');
