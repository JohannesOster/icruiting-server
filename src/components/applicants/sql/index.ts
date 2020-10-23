import {QueryFile} from 'pg-promise';
import {join} from 'path';

const options = {minify: true};

export const selectApplicants = new QueryFile(
  join(__dirname, 'selectApplicants.sql'),
  options,
);

export const selectApplicant = new QueryFile(
  join(__dirname, 'selectApplicant.sql'),
  options,
);

export const selectReport = new QueryFile(
  join(__dirname, 'selectReport.sql'),
  options,
);

export const selectAssessmentReport = new QueryFile(
  join(__dirname, 'selectAssessmentReport.sql'),
  options,
);

export const selectApplicantReport = new QueryFile(
  join(__dirname, 'selectApplicantReport.sql'),
  options, 
);
