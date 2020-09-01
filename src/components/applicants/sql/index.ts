import {QueryFile} from 'pg-promise';
import {join} from 'path';

const options = {minify: true};

const selectApplicants = new QueryFile(
  join(__dirname, 'selectApplicants.sql'),
  options,
);

const selectReport = new QueryFile(
  join(__dirname, 'selectReport.sql'),
  options,
);

export {selectApplicants, selectReport};
