import db from '../../db';
import {
  selectReport,
  selectApplicantReport as selectApplicantReportSQL,
} from './sql';
import {decamelizeKeys} from 'humps';
import {buildReport} from 'db/repos/utils';

export const dbSelectReport = (params: {
  tenantId: string;
  applicantId: string;
  formCategory: 'screening' | 'assessment';
}) => {
  return db.oneOrNone(selectReport, decamelizeKeys(params)).then((report) => {
    if (!report) return report;
    return buildReport(report);
  });
};

export const dbSelectApplicantReport = (tenantId: string, jobId: string) => {
  return db
    .any(selectApplicantReportSQL, decamelizeKeys({tenantId, jobId}))
    .then((resp) => resp[0]);
};
