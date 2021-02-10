import {QueryFile} from 'pg-promise';
import {join} from 'path';

const options = {minify: true};

export const selectReport = new QueryFile(
  join(__dirname, 'selectReport.sql'),
  options,
);

export const selectAll = new QueryFile(
  join(__dirname, 'selectAll.sql'),
  options,
);
