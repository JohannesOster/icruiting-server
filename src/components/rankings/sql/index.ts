import {QueryFile} from 'pg-promise';
import path from 'path';

const queryFile = (filname: string) => {
  const fullPath = path.join(__dirname, filname);
  return new QueryFile(fullPath, {minify: true});
};

export const createTables = queryFile('createTables.sql');
export const dropTables = queryFile('dropTables.sql');
export const truncateAll = queryFile('truncateAll.sql');
export const selectJobs = queryFile('selectJobs.sql');
export const selectScreeningRanking = queryFile('selectScreeningRanking.sql');
export const selectAssessmentRanking = queryFile('selectAssessmentRanking.sql');
