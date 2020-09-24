import db from '../../db';
import {
  selectReport,
  selectApplicantReport as selectApplicantReportSQL,
} from './sql';

export const dbSelectReport = (params: {
  tenantId: string;
  applicantId: string;
  formCategory: 'screening' | 'assessment';
}) => {
  return db.any(selectReport, params).then((resp) => resp[0]);
};

export const dbSelectApplicantReport = (tenantId: string, jobId: string) => {
  return db
    .any(selectApplicantReportSQL, {tenantId, jobId})
    .then((resp) => resp[0]);
};
