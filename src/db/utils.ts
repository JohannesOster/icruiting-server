import db from '.';
import {createTables, dropTables} from './sql';

export const createAllTables = () => db.any(createTables);
export const dropAllTables = () => db.any(dropTables);
export const endConnection = () => db.$pool.end();

require('make-runnable');
