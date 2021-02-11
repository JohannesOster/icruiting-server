import _ from 'lodash';
import {Row} from '../database';
import {Math, filterFormData, reduceSubmissions} from './math';
import {BaseReport} from './types';

export const calcReport = (rows: Row[], applicantId: string) => {
  const [forms, formFields] = filterFormData(rows);
  const submissions = reduceSubmissions(rows);
  const math = Math(formFields, submissions);
  const scores = math.calculate();

  // console.log(scores.formFieldScores);
  // // form fields
  // console.log('formFields');
  // console.log(util.inspect(formFieldScores, {depth: null}));
  // console.log(util.inspect(stdDevFormFieldScores, {depth: null}));
  // console.log(util.inspect(overallAvgFormFieldScore, {depth: null}));
  // console.log(util.inspect(overallStdDevFormFieldScore, {depth: null}));
  // console.log(util.inspect(overallAvgStdDevFormFieldScore, {depth: null}));
  // console.log(util.inspect(overallFormFieldMax, {depth: null}));
  // console.log(util.inspect(overallFormFieldMin, {depth: null}));
  // console.log(util.inspect(possibleFormFieldMin, {depth: null}));
  // console.log(util.inspect(possibleFormFieldMax, {depth: null}));

  // // forms
  // console.log('forms');
  // console.log(util.inspect(formScores, {depth: null}));
  // console.log(util.inspect(stdDevFormScores, {depth: null}));
  // console.log(util.inspect(overallAvgFormScore, {depth: null}));
  // console.log(util.inspect(overallStdDevFormScore, {depth: null}));
  // console.log(util.inspect(overallAvgStdDevFormScore, {depth: null}));
  // console.log(util.inspect(overallFormMax, {depth: null}));
  // console.log(util.inspect(overallFormMin, {depth: null}));
  // console.log(util.inspect(possibleFormMin, {depth: null}));
  // console.log(util.inspect(possibleFormMax, {depth: null}));

  // // formsCategory
  // console.log('formsCategory');
  // console.log(util.inspect(formCategoryScores, {depth: null}));
  // console.log(util.inspect(overallAvgFormCategoryScore, {depth: null}));
  // console.log(util.inspect(overallStdDevFormCategoryScore, {depth: null}));
  // console.log(util.inspect(overallFormCategoryMax, {depth: null}));
  // console.log(util.inspect(overallFormCategoryMin, {depth: null}));
  // console.log(util.inspect(possibleFormCategoryMax, {depth: null}));
  // console.log(util.inspect(possibleFormCategoryMin, {depth: null}));

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
    formResults: Object.entries(scores.formScores[applicantId]).map(
      ([formId, formScore]) => ({
        formId,
        formTitle: forms[formId].formTitle,
        formScore,
        avgFormScore: scores.overallAvgFormScore[formId],
        possibleFormMax: scores.possibleFormMax[formId],
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
            avgFormFieldScore:
              scores.overallAvgFormFieldScore[formId][formFieldId],
            overallFormFieldMax:
              scores.overallAvgFormFieldScore[formId][formFieldId],
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
    // jobRequirementResults: {
    //     jobRequirementId: string;
    //     jobRequirementScore: number;
    //     avgJobRequirementScore: number;
    //     requirementLabel: string;
    //     minValue: number;
    // }[];
  };

  return result;
};
