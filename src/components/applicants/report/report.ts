import _ from 'lodash';
import {ReportPrepareRow} from 'db/repos/formSubmissions/types';
import {Math, filterFormData, reduceSubmissions} from './math';
import {BaseReport} from './types';

export const calcReport = (rows: ReportPrepareRow[], applicantId: string) => {
  const [forms, formFields] = filterFormData(rows);
  const submissions = reduceSubmissions(rows);
  const math = Math(formFields, submissions);
  const scores = math.calculate();

  const sorted = Object.entries(scores.formCategoryScores)
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
    formCategoryScore: scores.formCategoryScores[applicantId],
    overallAvgFormCategoryScore: scores.overallAvgFormCategoryScore,
    overallStdDevFormCategoryScore: scores.overallStdDevFormCategoryScore,
    overallFormCategoryMax: scores.overallFormCategoryMax,
    overallFormCategoryMin: scores.overallFormCategoryMin,
    possibleFormCategoryMax: scores.possibleFormCategoryMax,
    possibleFormCategoryMin: scores.possibleFormCategoryMin,
    formResults: Object.entries(scores.formScores[applicantId]).map(
      ([formId, formScore]) => ({
        formId,
        formTitle: forms[formId].formTitle,
        formScore,
        stdDevFormScore: scores.stdDevFormScores[applicantId][formId],
        overallAvgFormScore: scores.overallAvgFormScore[formId],
        overallStdDevFormScore: scores.overallStdDevFormScore[formId],
        overallAvgStdDevFormScore: scores.overallAvgStdDevFormScore[formId],
        overallFormMin: scores.overallFormMin[formId],
        overallFormMax: scores.overallFormMax[formId],
        possibleFormMax: scores.possibleFormMax[formId],
        possibleFormMin: scores.possibleFormMin[formId],
        formFieldScores: Object.entries(
          scores.formFieldScores[applicantId][formId],
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
            aggregatedValues: [], // TODO
            formFieldScore,
            stdDevFormFieldScores:
              scores.stdDevFormFieldScores[applicantId][formId][formFieldId],
            overallAvgFormFieldScore:
              scores.overallAvgFormFieldScore[formId][formFieldId],
            overallStdDevFormFieldScore:
              scores.overallStdDevFormFieldScore[formId][formFieldId],
            overallAvgStdDevFormFieldScore:
              scores.overallAvgStdDevFormFieldScore[formId]?.[formFieldId],
            overallFormFieldMax:
              scores.overallFormFieldMax[formId][formFieldId],
            overallFormFieldMin:
              scores.overallFormFieldMin[formId][formFieldId],
            possibleFormFieldMax:
              scores.possibleFormFieldMax[formId][formFieldId],
            possibleFormFieldMin:
              scores.possibleFormFieldMin[formId][formFieldId],
          };
        }),
      }),
    ),
  };

  return result;
};
