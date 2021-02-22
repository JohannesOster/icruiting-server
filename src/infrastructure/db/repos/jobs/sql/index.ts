import {sql} from '../../../utils';
import {join} from 'path';

export default {list: sql(join(__dirname, 'list.sql'))};
