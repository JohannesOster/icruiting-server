import db from '../../db';
import {
  selectReport,
  selectApplicantReport as selectApplicantReportSQL,
} from './sql';
import {decamelizeKeys} from 'humps';
import {buildReport} from 'db/repos/utils';

const mergeRequirementResults = (
  array: {
    jobRequirementId: string;
    requirementLabel: string;
    avgJobRequirementScore: string;
    minValue: string;
  }[],
) => {
  return array.reduce(
    (
      acc,
      {jobRequirementId, avgJobRequirementScore, requirementLabel, minValue},
    ) => {
      if (!acc[jobRequirementId]) {
        acc[jobRequirementId] = {
          avgJobRequirementScore,
          requirementLabel,
          minValue,
        };
        return acc;
      }

      // convert both to number
      const sum =
        +acc[jobRequirementId].avgJobRequirementScore + +avgJobRequirementScore;
      const avg = sum / 2;

      acc[jobRequirementId] = {
        ...acc[jobRequirementId],
        avgJobRequirementScore: avg,
      };

      return acc;
    },
    {} as {[key: string]: {[key: string]: string | number}},
  );
};

export const dbSelectReport = (params: {
  tenantId: string;
  applicantId: string;
  formCategory: 'screening' | 'assessment';
}): Promise<ReturnType<typeof buildReport> | null> => {
  return db.oneOrNone(selectReport, decamelizeKeys(params)).then((report) => {
    if (!report) return;
    const {aggregatedJobRequirementsResult, ...rest} = report;
    if (!aggregatedJobRequirementsResult) return rest;
    const flattened = aggregatedJobRequirementsResult.flat();

    return {
      ...rest,
      formCategoryJobRequirementsResult: mergeRequirementResults(flattened),
    };
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
