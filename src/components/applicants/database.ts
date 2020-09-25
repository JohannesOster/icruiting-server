import db from '../../db';
import {
  selectReport,
  selectApplicantReport as selectApplicantReportSQL,
} from './sql';
import {decamelizeKeys} from 'humps';

export const dbSelectReport = (params: {
  tenantId: string;
  applicantId: string;
  formCategory: 'screening' | 'assessment';
}) => {
  return db.oneOrNone(selectReport, decamelizeKeys(params));
};

export const dbSelectApplicantReport = (tenantId: string, jobId: string) => {
  return db
    .any(selectApplicantReportSQL, decamelizeKeys({tenantId, jobId}))
    .then((resp) => resp[0]);
};
