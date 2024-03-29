import {sql} from 'infrastructure/db/utils';
import {join} from 'path';

export default {
  list: sql(join(__dirname, 'list.sql')),
  retrieve: sql(join(__dirname, 'retrieve.sql')),
};
