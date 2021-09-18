import {sql} from 'infrastructure/db/utils';
import {join} from 'path';

export default {
  list: sql(join(__dirname, 'list.sql')),
  retrieveReport: sql(join(__dirname, 'retrieveReport.sql')),
};
