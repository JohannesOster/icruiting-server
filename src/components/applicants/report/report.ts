import {Row} from '../database';
import {
  FormFieldScores,
  FormData,
  Data,
  OverallAvgFormFieldScore,
  FormScores,
  BaseReport,
} from './types';
import util from 'util';
import jstat from 'jstat';
import _ from 'lodash';

const formData: FormData = {};
const data: Data = {};

// formField results
const formFieldScores: FormFieldScores = {};
const stdDevFormFieldScores: FormFieldScores = {};
const overallAvgFormFieldScore: OverallAvgFormFieldScore = {};
const overallStdDevFormFieldScore: OverallAvgFormFieldScore = {};
const overallAvgStdDevFormFieldScore: OverallAvgFormFieldScore = {};
const overallFormFieldMax: OverallAvgFormFieldScore = {};
const overallFormFieldMin: OverallAvgFormFieldScore = {};
const possibleFormFieldMax: OverallAvgFormFieldScore = {};
const possibleFormFieldMin: OverallAvgFormFieldScore = {};

// formScores results
const formScores: FormScores = {};
const stdDevFormScores: FormScores = {};
const overallAvgFormScore: OverallAvgFormFieldScore = {};
const overallStdDevFormScore: OverallAvgFormFieldScore = {};
const overallAvgStdDevFormScore: OverallAvgFormFieldScore = {};
const overallFormMax: OverallAvgFormFieldScore = {};
const overallFormMin: OverallAvgFormFieldScore = {};
const possibleFormMax: FormScores = {};
const possibleFormMin: FormScores = {};

// formCategoryScores
type FCategory = {[applicantId: string]: number};
const formCategoryScores: FCategory = {};
let overallAvgFormCategoryScore: number;
let overallStdDevFormCategoryScore: number;
let overallFormCategoryMax: number;
let overallFormCategoryMin: number;
let possibleFormCategoryMax: number;
let possibleFormCategoryMin: number;

export const calcReport = (rows: Row[], applicantId: string) => {
  math.preprocess.filterFormData(rows);
  math.preprocess.distributeData(rows);

  // (1) formField
  Object.entries(formData).forEach(([formId, form]) => {
    Object.keys(form).forEach((formFieldId) => {
      const applicantIds = Object.keys(data);
      applicantIds.forEach((applId) => {
        const path = `${applId}.${formId}.${formFieldId}`;
        const [score, stdev] = math.formFields.score(
          applId,
          formId,
          formFieldId,
        );
        _.set(formFieldScores, path, score);
        _.set(stdDevFormFieldScores, path, stdev);
      });

      const path = `${formId}.${formFieldId}`;
      const [overallAvg, overallStdDev] = math.formFields.overallScore(
        formId,
        formFieldId,
      );
      _.set(overallAvgFormFieldScore, path, overallAvg);
      _.set(overallStdDevFormFieldScore, path, overallStdDev);

      const avgStdDev = math.formFields.overallAvgStdDev(formId, formFieldId);
      _.set(overallAvgStdDevFormScore, path, avgStdDev);

      const [overallMin, overallMax] = math.formFields.overallExtrema(
        formId,
        formFieldId,
      );
      _.set(overallFormFieldMin, path, overallMin);
      _.set(overallFormFieldMax, path, overallMax);

      const [possibleMin, possibleMax] = math.formFields.possibleExtrema(
        formId,
        formFieldId,
      );
      _.set(possibleFormFieldMax, path, possibleMax);
      _.set(possibleFormFieldMin, path, possibleMin);
    });

    // - Forms
    const applicantIds = Object.keys(data);
    applicantIds.forEach((applId) => {
      const path = `${applId}.${formId}`;
      const [score, stdev] = math.forms.score(applId, formId);
      _.set(formScores, path, score);
      _.set(stdDevFormScores, path, stdev);
    });

    const path = `${formId}`;
    const [overallAvg, overallStdDev] = math.forms.overallScore(formId);
    _.set(overallAvgFormScore, path, overallAvg);
    _.set(overallStdDevFormScore, path, overallStdDev);

    const avgStdDev = math.forms.overallAvgStdDev(formId);
    _.set(overallAvgStdDevFormScore, path, avgStdDev);

    const [overallMin, overallMax] = math.forms.overallExtrema(formId);
    _.set(overallFormMin, path, overallMin);
    _.set(overallFormMax, path, overallMax);

    const [possibleMin, possibleMax] = math.forms.possibleExtrema(formId);
    _.set(possibleFormMax, path, possibleMax);
    _.set(possibleFormMin, path, possibleMin);
  });

  // - FormCategory
  const applicantIds = Object.keys(data);
  applicantIds.forEach((applId) => {
    const path = `${applId}`;
    const score = math.formCategory.score(applId);
    _.set(formCategoryScores, path, score);
  });

  const [overallAvg, overallStdDev] = math.formCategory.overallScore();
  overallAvgFormCategoryScore = overallAvg;
  overallStdDevFormCategoryScore = overallStdDev;

  const [overallMin, overallMax] = math.formCategory.overallExtrema();
  overallFormCategoryMin = overallMin;
  overallFormCategoryMax = overallMax;

  const [possibleMin, possibleMax] = math.formCategory.possibleExtrema();
  possibleFormCategoryMin = possibleMin;
  possibleFormCategoryMax = possibleMax;

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

  Object.entries(formCategoryScores)
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
    rank: Object.entries(formCategoryScores)
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

const math = {
  preprocess: {
    filterFormData: (rows: Row[]) => {
      rows.forEach((row) => {
        if (!!formData[row.formId]?.[row.formFieldId]) return;
        const {intent, options, rowIndex, label, jobRequirementId} = row;
        const entry = {intent, options, rowIndex, label, jobRequirementId};
        _.set(formData, `${row.formId}.${row.formFieldId}`, entry);
      });
    },
    distributeData: (rows: Row[]) => {
      rows.forEach((row) => {
        const {applicantId, submitterId, formId, formFieldId} = row;
        const path = `${applicantId}.${submitterId}.${formId}.${formFieldId}`;
        _.set(data, path, row);
      });
    },
  },
  formFields: {
    score: (applicantId: string, formId: string, formFieldId: string) => {
      const submissions = Object.values(data[applicantId]);
      const values = submissions
        .map((sub) => {
          if (!sub[formId]) return null; // form is not part of this submission
          return +sub[formId][formFieldId].submissionValue;
        })
        .filter((val) => !!val);
      return [jstat.mean(values), jstat.stdev(values)];
    },
    overallScore: (formId: string, formFieldId: string) => {
      const scores = Object.values(formFieldScores).map(
        (applScores) => applScores[formId][formFieldId],
      );
      return [jstat.mean(scores), jstat.stdev(scores)];
    },
    overallAvgStdDev: (formId: string, formFieldId: string) => {
      const values = Object.values(stdDevFormFieldScores).map(
        (applStds) => applStds[formId][formFieldId],
      );
      return jstat.mean(values);
    },
    overallExtrema: (formId: string, formFieldId: string) => {
      const scores = Object.values(formFieldScores).map(
        (applScores) => applScores[formId][formFieldId],
      );
      return [jstat.min(scores), jstat.max(scores)];
    },
    possibleExtrema: (formId: string, formFieldId: string) => {
      const values = Object.values(
        formData[formId][formFieldId].options || {},
      ).map(({value}) => +value);
      return [jstat.min(values), jstat.max(values)];
    },
  },
  forms: {
    score: (applicantId: string, formId: string) => {
      const submissions = Object.values(data[applicantId]);
      const scores = submissions
        .map((sub) => {
          if (!sub[formId]) return null;
          const fields = Object.values(sub[formId]).map(
            ({submissionValue}) => +submissionValue,
          );
          return jstat.sum(fields); // = specific formSubmissionScore
        })
        .filter((val) => !!val);
      return [jstat.mean(scores), jstat.stdev(scores)];
    },
    overallScore: (formId: string) => {
      const scores = Object.values(formScores).map((scores) => scores[formId]);
      return [jstat.mean(scores), jstat.stdev(scores)];
    },
    overallAvgStdDev: (formId: string) => {
      const vals = Object.values(stdDevFormScores).map((stds) => stds[formId]);
      return jstat.mean(vals);
    },
    overallExtrema: (formId: string) => {
      const scores = Object.values(formScores).map((score) => score[formId]);
      return [jstat.min(scores), jstat.max(scores)];
    },
    possibleExtrema: (formId: string) => {
      const minimas = Object.values(possibleFormFieldMin[formId]);
      const maximas = Object.values(possibleFormFieldMax[formId]);
      return [jstat.sum(minimas), jstat.sum(maximas)];
    },
  },
  formCategory: {
    score: (applicantId: string) => {
      const values = Object.values(formScores[applicantId]);
      return jstat.sum(values);
    },
    overallScore: () => {
      const values = Object.values(formCategoryScores);
      return [jstat.mean(values), jstat.stdev(values)];
    },
    overallExtrema: () => {
      const values = Object.values(formCategoryScores);
      return [jstat.min(values), jstat.max(values)];
    },
    possibleExtrema: () => {
      const minimas = Object.values(possibleFormMax);
      const maximas = Object.values(possibleFormMin);
      return [jstat.sum(minimas), jstat.sum(maximas)];
    },
  },
};

/*

Naming convention:
- welche felder beziehen sich auf alle welche auf einen Kandidate
  alle        => overall präfix
  nurKandidat => kein präfix

Result
=====================

general
-----------
rank                            // Rang nach dem formCategoryScore

formCategory:
---------------
!! Wie hat er abgeschnitten, wie stark schwanken die ergebnisse insgesamt
!! in welcher Range liegen die Ergebnisse und was sind die möglichen Min / Max

formCategoryScore               // wie hat der Kandidat abgeschnitten
overallStdDevFormCategoryScore  // wie stark schwanken die Ergebnisse?
overlallAvgFormCategoryScore    // wie gut sind Kandidaten durchschnittlich
overall_max / overall_min       // in welchem Interval liegen die Ergebnisse?
possible_max / possible_min     // was ist das mögliche Interval? (muss nicht immer 0-x sein)

form
-----------------
formScore                         // wie hat der Kandidat in dieser einen Übung abgeschnitten?
stdDevFormScore                   // wie stark schwanken die Meinungen über diesen Kandidaten bezogen auf diese Übung
overallAvgFormScore               // wie gut haben Kanditaten durchschnittlich abgeschnitten?
overallAvgStdDevFormScore         // wie stark schwanken die Meinungen durchschnittlich über die einzelnen Kandidaten (durschnitt aller std's)
overallStdDevFormScore            // wie stark schwanken die Ergebnisse in dieser Übung? (std' aller formScores)
overall_max / overall_min         // in welchem Intervall liegen die Ergebnisse für dies Übung?
possible_max / possible_min       // was ist das mögliche Interval? (muss nicht immer 0-x sein)

formField
-------------------
formFieldScore                    // wie gut war der Kandidat in diesem Feld
stdDevFormFieldScore              // wie stark schwanken die Meinungen über diesen Kandidaten bei dieser einen Frage
overallAvgFormFieldScore          // wie gut waren Kandidaten durchschnittlich in diesem Feld
overallAvgStdDevFormScore         // wie stark schwanken die Meinungen durchschnittlich bei dieser Frage?
overallStdDevFormScore            // wie stark schwanken die Meinungen insgesamt in dieser Frage? (std aller formmulareintragsfelder)
overall_max / overall_min         // in welchem Intervall liegen die Ergebnisse für dies Frage?
possible_max / possible_min       // was ist das mögliche Interval? (muss nicht immer 0-x sein)
*/
