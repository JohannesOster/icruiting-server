import {QueryFile} from 'pg-promise';
import path from 'path';
import db from '.';

/** Helper function to execute slq statements from a file */
const sqlFile = (filname: string) => {
  const fullPath = path.join(__dirname, `sql/${filname}`);
  const queryFile = new QueryFile(fullPath, {minify: true});
  return db.any(queryFile);
};

const createAllTables = () => sqlFile('createTables.sql');
const dropAllTables = () => sqlFile('dropTables.sql');
const endConnection = () => db.$pool.end();

export {createAllTables, dropAllTables, endConnection};

require('make-runnable');
