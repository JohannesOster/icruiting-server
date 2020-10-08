import db from '.';
import {
  createTables,
  dropTables,
  truncateAll,
  createFunctions,
  dropFunctions,
  createViews,
  dropViews,
} from './sql';

export const createAll = async () => {
  await Promise.all([db.any(createTables), db.any(createFunctions)]);
  return db.any(createViews);
};
export const dropAll = async () => {
  await db.any(dropViews);
  return Promise.all([db.any(dropTables), db.any(dropFunctions)]);
};
export const endConnection = () => db.$pool.end();
export const truncateAllTables = () => db.any(truncateAll);

require('make-runnable');

export const rawText = (text: string) => ({
  toPostgres: () => text,
  rawType: true,
});
