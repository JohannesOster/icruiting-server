import {join} from 'path';
import {sql} from '../utils';

export const createTables = sql(join(__dirname, 'createTables.sql'));
export const createFunctions = sql(join(__dirname, 'createFunctions.sql'));
export const createViews = sql(join(__dirname, 'createViews.sql'));

export const dropTables = sql(join(__dirname, 'dropTables.sql'));
export const dropFunctions = sql(join(__dirname, 'dropFunctions.sql'));
export const dropViews = sql(join(__dirname, 'dropViews.sql'));

export const truncateAll = sql(join(__dirname, 'truncateAll.sql'));
