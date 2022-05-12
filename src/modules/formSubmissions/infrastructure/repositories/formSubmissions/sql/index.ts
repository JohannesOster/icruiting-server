import {sql} from 'infrastructure/db/utils';
import {join} from 'path';

export default {
  retrieve: sql(join(__dirname, 'retrieve.sql')),
  prepareReport: sql(join(__dirname, 'prepareReport.sql')),
  prepareTEReport: sql(join(__dirname, 'prepareTEReport.sql')),
  list: sql(join(__dirname, 'list.sql')),
};
