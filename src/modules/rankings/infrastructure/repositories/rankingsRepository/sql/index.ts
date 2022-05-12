import {sql} from 'infrastructure/db/utils';
import {join} from 'path';

export default {
  retrieve: sql(join(__dirname, 'retrieve.sql')),
  retrieveTE: sql(join(__dirname, 'retrieveTE.sql')),
};
