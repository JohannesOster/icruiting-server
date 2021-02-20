import _ from 'lodash';
import {ReportPrepareRow} from 'infrastructure/db/repos/formSubmissions/types';
import {filterFormData, reduceSubmissions} from './preprocessor';
import {Report} from './types';
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

  const result: Report = {
    rank,
    formCategory: rows[0].formCategory,
    formCategoryScore: report.formCategoryScores[applicantId],
    formResults: Object.entries(forms).map(([formId, {formTitle}]) => {
      const formScore = report.formScores[applicantId][formId];
      const fields = formFields[formId];
      return {
        formId,
        formTitle: forms[formId].formTitle,
        formScore: formScore.mean,
        stdDevFormScore: formScore.stdDev,
        formFieldScores: Object.entries(fields).map(([formFieldId, value]) => {
          const {jobRequirementId, rowIndex, intent, label} = value;
          const formFieldScore =
            report.formFieldScores[applicantId][formId][formFieldId];
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
            countDistinct: _.get(
              report.countDistinct,
              `${applicantId}.${formId}.${formFieldId}`,
              undefined,
            ) as {[key: string]: number} | undefined,
            formFieldScore: formFieldScore?.mean,
            stdDevFormFieldScores: formFieldScore?.stdDev,
          };
        }),
      };
    }),
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
