import db from '../../db';
import {selectAll, selectReport} from './sql';
import {decamelizeKeys} from 'humps';
import {EFormCategory} from 'db/repos/forms';
import {FormFieldIntent} from './report/types';

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

export type Row = {
  submissionValue: string;
  formFieldId: string;
  applicantId: string;
  submitterId: string;
  intent: FormFieldIntent;
  rowIndex: number;
  label: string;
  options?: {label: string; value: string}[];
  formId: string;
  formTitle: string;
  formCategory: EFormCategory;
  jobTitle: string;
  requirementLabel: string;
  jobRequirementId: string;
};

export const dbSelectAll = (
  tenantId: string,
  formCategory: 'screening' | 'assessment',
): Promise<Row[]> => {
  return db.any(selectAll, decamelizeKeys({tenantId, formCategory}));
};
