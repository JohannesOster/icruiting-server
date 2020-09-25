import {sql} from '../../../utils';
import {join} from 'path';

export default {
  all: sql(join(__dirname, 'all.sql')),
  find: sql(join(__dirname, 'find.sql')),
};
