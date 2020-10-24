import db from '../../db';
import {
  selectReport,
  selectAssessmentReport,
  selectApplicantReport as selectApplicantReportSQL,
} from './sql';
import {decamelizeKeys} from 'humps';
import {buildReport} from 'db/repos/utils';
import {buildAssessmentReport} from './utils';

export const dbSelectReport = (params: {
  tenantId: string;
  applicantId: string;
  formCategory: 'screening' | 'assessment';
}): Promise<ReturnType<typeof buildReport> | null> => {
  if (params.formCategory === 'screening') {
    return db.oneOrNone(selectReport, decamelizeKeys(params)).then((report) => {
      if (!report) return report;
      return buildReport(report);
    });
  }

  return db
    .oneOrNone(selectAssessmentReport, decamelizeKeys(params))
    .then((report) => {
      if (!report) return report;
      return buildAssessmentReport(report);
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
