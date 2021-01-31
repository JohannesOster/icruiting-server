import {sql} from '../../../utils';
import {join} from 'path';

export default {
  retrieve: sql(join(__dirname, 'retrieve.sql')),
};
