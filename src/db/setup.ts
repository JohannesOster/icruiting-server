import db from '.';
import {
  createTables,
  dropTables,
  truncateAll,
  createFunctions,
  dropFunctions,
} from './sql';

export const createAll = () => {
  return Promise.all([db.any(createTables), db.any(createFunctions)]);
};
export const dropAll = () => {
  return Promise.all([db.any(dropTables), db.any(dropFunctions)]);
};
export const endConnection = () => db.$pool.end();
export const truncateAllTables = () => db.any(truncateAll);

require('make-runnable');

export const rawText = (text: string) => ({
  toPostgres: () => text,
  rawType: true,
});
