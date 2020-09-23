import {QueryFile} from 'pg-promise';
import {join} from 'path';

const options = {minify: true};

const selectFormSubmission = new QueryFile(
  join(__dirname, 'selectFormSubmission.sql'),
  options,
);

export {selectFormSubmission};
