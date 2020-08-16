import {QueryFile} from 'pg-promise';
import {join} from 'path';

const options = {minify: true};

const selectJobs = new QueryFile(join(__dirname, 'selectJobs.sql'), options);

export {selectJobs};
