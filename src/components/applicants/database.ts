import db from '../../db';
import {selectReport} from './sql';
import {decamelizeKeys} from 'humps';

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
}): Promise<any | null> => {
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
