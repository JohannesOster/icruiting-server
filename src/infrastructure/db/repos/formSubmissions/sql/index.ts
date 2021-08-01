import {sql} from '../../../utils';
import {join} from 'path';

export default {
  retrieve: sql(join(__dirname, 'retrieve.sql')),
  prepareReport: sql(join(__dirname, 'prepareReport.sql')),
  list: sql(join(__dirname, 'list.sql')),
};
