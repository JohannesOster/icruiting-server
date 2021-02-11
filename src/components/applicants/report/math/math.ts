import _ from 'lodash';
import jstat from 'jstat';
import {FormFieldScores, OverallAvgFormFieldScore, FormScores} from '../types';
import {FormData, FormSubmissionData} from './types';

/*
Naming convention:
  regarding all applicatnts        => overall präfix
  regarding only one applicant     => kein präfix

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

export const Math = (formFields: FormData, submissions: FormSubmissionData) => {
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
  type OverallFormScore = {[formId: string]: number};
  const formScores: FormScores = {};
  const stdDevFormScores: FormScores = {};
  const overallAvgFormScore: OverallFormScore = {};
  const overallStdDevFormScore: OverallFormScore = {};
  const overallAvgStdDevFormScore: OverallFormScore = {};
  const overallFormMax: OverallFormScore = {};
  const overallFormMin: OverallFormScore = {};
  const possibleFormMax: OverallFormScore = {};
  const possibleFormMin: OverallFormScore = {};

  // formCategoryScores, default 0 to be able to return them
  const formCategoryScores: {[applicantId: string]: number} = {};
  let overallAvgFormCategoryScore: number = 0;
  let overallStdDevFormCategoryScore: number = 0;
  let overallFormCategoryMax: number = 0;
  let overallFormCategoryMin: number = 0;
  let possibleFormCategoryMax: number = 0;
  let possibleFormCategoryMin: number = 0;

  const calculator = {
    formFields: {
      score: (applicantId: string, formId: string, formFieldId: string) => {
        const values = Object.values(submissions[applicantId])
          .map((sub) => {
            if (!sub[formId]) return null;
            return +sub[formId][formFieldId];
          })
          .filter((val) => val !== null);
        return [jstat.mean(values), jstat.stdev(values)];
      },
      overallScore: (formId: string, formFieldId: string) => {
        const scores = Object.values(formFieldScores)
          .map((applScores) => {
            if (!applScores[formId]) return null;
            return applScores[formId][formFieldId];
          })
          .filter((val) => val !== null);
        return [jstat.mean(scores), jstat.stdev(scores)];
      },
      overallAvgStdDev: (formId: string, formFieldId: string) => {
        const values = Object.values(stdDevFormFieldScores)
          .map((applStds) => {
            if (!applStds[formId]) return null;
            return applStds[formId][formFieldId];
          })
          .filter((val) => val !== null);
        return jstat.mean(values);
      },
      overallExtrema: (formId: string, formFieldId: string) => {
        const scores = Object.values(formFieldScores)
          .map((applScores) => {
            if (!applScores[formId]) return null;
            return applScores[formId][formFieldId];
          })
          .filter((val) => val !== null);
        return [jstat.min(scores), jstat.max(scores)];
      },
      possibleExtrema: (formId: string, formFieldId: string) => {
        const values = Object.values(
          formFields[formId][formFieldId].options || {},
        ).map(({value}) => +value);
        return [jstat.min(values), jstat.max(values)];
      },
    },
    forms: {
      score: (applicantId: string, formId: string) => {
        const scores = Object.values(submissions[applicantId])
          .map((sub) => {
            if (!sub[formId]) return;
            const fields = Object.values(sub[formId]).map((val) => +val);
            return jstat.sum(fields); // = specific formSubmissionScore
          })
          .filter((val) => !!val);

        if (scores.length <= 0) return;

        return [jstat.mean(scores), jstat.stdev(scores)];
      },
      overallScore: (formId: string) => {
        const scores = Object.values(formScores).map(
          (scores) => scores[formId],
        );
        return [jstat.mean(scores), jstat.stdev(scores)];
      },
      overallAvgStdDev: (formId: string) => {
        const vals = Object.values(stdDevFormScores).map(
          (stds) => stds[formId],
        );
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
        return jstat.mean(values);
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

  const calculate = () => {
    Object.entries(formFields).forEach(([formId, form]) => {
      Object.keys(form).forEach((formFieldId) => {
        if (formFields[formId][formFieldId].intent !== 'sum_up') return;
        const applicantIds = Object.keys(submissions);
        applicantIds.forEach((applId) => {
          const sub = Object.values(submissions[applId]).find((value) =>
            value[formId] ? value : undefined,
          );
          if (!sub) return;
          const path = `${applId}.${formId}.${formFieldId}`;
          const [score, stdev] = calculator.formFields.score(
            applId,
            formId,
            formFieldId,
          );
          _.set(formFieldScores, path, score);
          _.set(stdDevFormFieldScores, path, stdev);
        });

        const path = `${formId}.${formFieldId}`;
        const [overallAvg, overallStdDev] = calculator.formFields.overallScore(
          formId,
          formFieldId,
        );
        _.set(overallAvgFormFieldScore, path, overallAvg);
        _.set(overallStdDevFormFieldScore, path, overallStdDev);

        const avgStdDev = calculator.formFields.overallAvgStdDev(
          formId,
          formFieldId,
        );
        _.set(overallAvgStdDevFormFieldScore, path, avgStdDev);

        const [overallMin, overallMax] = calculator.formFields.overallExtrema(
          formId,
          formFieldId,
        );
        _.set(overallFormFieldMin, path, overallMin);
        _.set(overallFormFieldMax, path, overallMax);

        const [
          possibleMin,
          possibleMax,
        ] = calculator.formFields.possibleExtrema(formId, formFieldId);
        _.set(possibleFormFieldMax, path, possibleMax);
        _.set(possibleFormFieldMin, path, possibleMin);
      });

      // - Forms
      const applicantIds = Object.keys(submissions);
      applicantIds.forEach((applId) => {
        const path = `${applId}.${formId}`;
        const res = calculator.forms.score(applId, formId);
        if (!res) return; // no submission exist for this form
        const [score, stdev] = res;
        _.set(formScores, path, score);
        _.set(stdDevFormScores, path, stdev);
      });

      const path = `${formId}`;
      const [overallAvg, overallStdDev] = calculator.forms.overallScore(formId);
      _.set(overallAvgFormScore, path, overallAvg);
      _.set(overallStdDevFormScore, path, overallStdDev);

      const avgStdDev = calculator.forms.overallAvgStdDev(formId);
      _.set(overallAvgStdDevFormScore, path, avgStdDev);

      const [overallMin, overallMax] = calculator.forms.overallExtrema(formId);
      _.set(overallFormMin, path, overallMin);
      _.set(overallFormMax, path, overallMax);

      const [possibleMin, possibleMax] = calculator.forms.possibleExtrema(
        formId,
      );
      _.set(possibleFormMax, path, possibleMax);
      _.set(possibleFormMin, path, possibleMin);
    });

    // - FormCategory
    const applicantIds = Object.keys(submissions);
    applicantIds.forEach((applId) => {
      const path = `${applId}`;
      const score = calculator.formCategory.score(applId);
      _.set(formCategoryScores, path, score);
    });

    const [overallAvg, overallStdDev] = calculator.formCategory.overallScore();
    overallAvgFormCategoryScore = overallAvg;
    overallStdDevFormCategoryScore = overallStdDev;

    const [overallMin, overallMax] = calculator.formCategory.overallExtrema();
    overallFormCategoryMin = overallMin;
    overallFormCategoryMax = overallMax;

    const [
      possibleMin,
      possibleMax,
    ] = calculator.formCategory.possibleExtrema();
    possibleFormCategoryMin = possibleMin;
    possibleFormCategoryMax = possibleMax;

    return {
      formFieldScores,
      stdDevFormFieldScores,
      overallAvgFormFieldScore,
      overallStdDevFormFieldScore,
      overallAvgStdDevFormFieldScore,
      overallFormFieldMax,
      overallFormFieldMin,
      possibleFormFieldMax,
      possibleFormFieldMin,

      formScores,
      stdDevFormScores,
      overallAvgFormScore,
      overallStdDevFormScore,
      overallAvgStdDevFormScore,
      overallFormMax,
      overallFormMin,
      possibleFormMax,
      possibleFormMin,

      formCategoryScores,
      overallAvgFormCategoryScore,
      overallStdDevFormCategoryScore,
      overallFormCategoryMax,
      overallFormCategoryMin,
      possibleFormCategoryMax,
      possibleFormCategoryMin,
    };
  };

  return {calculate};
};
