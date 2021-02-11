import {Row} from '../database';
import {Math, filterFormData, reduceSubmissions} from './math';
import _ from 'lodash';

export const calcReport = (rows: Row[], applicantId: string) => {
  const math = Math(filterFormData(rows), reduceSubmissions(rows));
  const scores = math.calculate();

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

  Object.entries(scores.formCategoryScores)
    .map(([id, score]) => ({[id]: score}))
    .sort((a, b) => {
      const first = Object.values(a)[0];
      const sec = Object.values(b)[0];
      return first < sec ? -1 : 1;
    })
    .forEach((e, i) => {
      console.log(e);
      console.log(Object.keys(e)[0] === applicantId, i);
    });

  const result = {
    rank: Object.entries(scores.formCategoryScores)
      .map(([id, score]) => ({[id]: score}))
      .sort((a, b) => {
        const first = Object.values(a)[0];
        const sec = Object.values(b)[0];
        return first > sec ? -1 : 1;
      })
      .findIndex((item) => Object.keys(item)[0] === applicantId),
  };

  return result;
};
