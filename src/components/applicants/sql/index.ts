import {QueryFile} from 'pg-promise';
import {join} from 'path';

const options = {minify: true};

const selectApplicants = new QueryFile(
  join(__dirname, 'selectApplicants.sql'),
  options,
);

export {selectApplicants};
