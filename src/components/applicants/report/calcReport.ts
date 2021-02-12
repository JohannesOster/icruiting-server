import _ from 'lodash';
import {ReportPrepareRow} from 'db/repos/formSubmissions/types';
import {filterFormData, reduceSubmissions} from './preprocessor';
import {BaseReport} from './types';
import {ReportBuilder} from './reportBuilder';

export const calcReport = (rows: ReportPrepareRow[], applicantId: string) => {
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
            aggregatedValues:
              report.aggregates[applicantId][formId][formFieldId],
            formFieldScore: formFieldScore.mean,
            stdDevFormFieldScores: formFieldScore.stdDev,
          };
        }),
      }),
    ),
  };

  return result;
};
