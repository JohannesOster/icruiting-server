import {sql} from '../../../utils';
import {join} from 'path';

export default {
  find: sql(join(__dirname, 'find.sql')),
};
