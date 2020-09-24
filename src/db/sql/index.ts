import {join} from 'path';
import {sql} from '../utils';

export const createTables = sql(join(__dirname, 'createTables.sql'));
export const dropTables = sql(join(__dirname, 'dropTables.sql'));
export const truncateAll = sql(join(__dirname, 'truncateAll.sql'));
