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
}): Promise<ReturnType<typeof buildReport> | null> => {
  return db.oneOrNone(selectReport, decamelizeKeys(params)).then((report) => {
    if (!report) return report;
    report = {...report, normalization: report.normalization[0]};
    return buildReport(report);
  });
};

export const dbSelectApplicantReport = (
  tenantId: string,
  jobId: string,
): Promise<{
  tenantId: string;
  jobId: string;
  attributes: {label: string; formItemId: string}[];
  image?: {label: string; formItemId: string};
} | null> => {
  return db.oneOrNone(
    selectApplicantReportSQL,
    decamelizeKeys({tenantId, jobId}),
  );
};
