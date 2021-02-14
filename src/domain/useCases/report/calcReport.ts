import _ from 'lodash';
import {ReportPrepareRow} from 'infrastructure/db/repos/formSubmissions/types';
import {filterFormData, reduceSubmissions} from './preprocessor';
import {BaseReport} from './types';
import {ReportBuilder} from './reportBuilder';
import {JobRequirement} from 'domain/entities';

export const calcReport = (
  rows: ReportPrepareRow[],
  applicantId: string,
  jobRequiremnts: JobRequirement[],
) => {
  const [forms, formFields] = filterFormData(rows);
  const submissions = reduceSubmissions(rows);
  const report = ReportBuilder(formFields, submissions);

  const sorted = Object.entries(report.formCategoryScores)
    .map(([id, score]) => ({[id]: score}))
    .sort((a, b) => {
      const first = Object.values(a)[0];
      const sec = Object.values(b)[0];
      return first > sec ? -1 : 1;
    });

  const rank =
    sorted.findIndex((item) => Object.keys(item)[0] === applicantId) + 1;

  const result: BaseReport = {
    rank,
    formCategory: rows[0].formCategory,
    formCategoryScore: report.formCategoryScores[applicantId],
    formResults: Object.entries(report.formScores[applicantId]).map(
      ([formId, formScore]) => ({
        formId,
        formTitle: forms[formId].formTitle,
        formScore: formScore.mean,
        stdDevFormScore: formScore.stdDev,
        formFieldScores: Object.entries(
          report.formFieldScores[applicantId][formId],
        ).map(([formFieldId, formFieldScore]) => {
          const {jobRequirementId, rowIndex, intent, label} = formFields[
            formId
          ][formFieldId];
          return {
            formFieldId,
            jobRequirementId,
            rowIndex,
            intent,
            label,
            aggregatedValues: _.get(
              report.aggregates,
              `${applicantId}.${formId}.${formFieldId}`,
              [],
            ) as string[],
            formFieldScore: formFieldScore.mean,
            stdDevFormFieldScores: formFieldScore.stdDev,
          };
        }),
      }),
    ),
    jobRequirementResults: jobRequiremnts.map(
      ({jobRequirementId, requirementLabel, minValue}) => ({
        jobRequirementId,
        jobRequirementScore: _.get(
          report.jobRequirements,
          `${applicantId}.${jobRequirementId}`,
          0,
        ) as number,
        requirementLabel,
        minValue: minValue ? +minValue : undefined,
      }),
    ),
  };

  return result;
};
