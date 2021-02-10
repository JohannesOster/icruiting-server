import {EFormCategory} from 'db/repos/forms';
import {Row} from './database';
import util from 'util';

type BaseReport = {
  rank: number;
  formCategory: EFormCategory;
  formCategoryScore: number;
  avgFormCategoryScore: number;
  // TODO: difference overall and average std_dev
  formResults: {
    formId: string;
    formTitle: string;
    formScore: number;
    avgFormScore: number;
    formFieldScores: {
      formFieldId: string;
      jobRequirementId: string;
      rowIndex: number;
      intent: 'sum_up' | 'counst_distinct' | 'aggregate';
      label: string;
      aggregatedValues: string[];
      /** avg value for applicant for form_field */
      formFieldScore: number;
      /** Overall avg of all submissions for this field */
      avgFormFieldScore: number;
      /** Possible max for this field */
      formFieldMax: number;
      /** Possible min for this field */
      formFieldMin: number;
      /** Achieved max for this field */
      formSubmissionFieldMax: number;
      /** Achieved min for this field */
      formSubmissionFieldMin: number;
      /** Achieved max overall for this field */
      overallFormSubmissionFieldMax: number;
      /** Achieved min overall for this field */
      overallFormSubmissionFieldMin: number;
    }[];
  }[];
  jobRequirementResults: {
    jobRequirementId: string;
    jobRequirementScore: number;
    avgJobRequirementScore: number;
    requirementLabel: string;
    minValue: number;
  }[];
};

export const getReport = (rows: Row[], applicantId: string) => {
  /**
   * (1) get a separated list
   *    forms:
   *      {formId}:
   *        {formField}:
   *            raw:
   *              -- submission_field (all applicants, all submitters)
   */
  const separated = rows.reduce((acc, curr) => {
    push(`forms.${curr.formId}.${curr.formFieldId}.raw`, curr, acc);
    return acc;
  }, {} as any);

  /**
   * (2) calculate average for formField for one applicants
   *    forms:
   *      {formId}:
   *        {formField}:
   *            formFieldScore
   *            raw:
   *              -- submission_field (all applicants, all submitters)
   *
   *  => for each form
   *    => average, min, max for formField where (applicant_id = xyz)
   */
  Object.entries(separated.forms).forEach(([formId, formFields]: any) => {
    Object.entries(formFields).forEach(([formFieldId, formField]: any) => {
      const submissions = formField.raw;
      if (formField.raw[0].intent === 'sum_up') {
        let sum = 0;
        let counter = 0;
        let min = +submissions[0].submissionValue;
        let max = +submissions[0].submissionValue;

        // sum / counter overall
        let overallSum = 0;
        let overallCounter = 0;
        let overallMin = +submissions[0].submissionValue;
        let overallMax = +submissions[0].submissionValue;

        submissions.forEach((submission: any) => {
          if (overallMin > +submission.submissionValue)
            overallMin = +submission.submissionValue;
          if (overallMax < +submission.submissionValue)
            overallMax = +submission.submissionValue;

          overallSum += +submission.submissionValue;
          overallCounter++;

          if (submission.applicantId !== applicantId) return;

          if (min > +submission.submissionValue)
            min = +submission.submissionValue;
          if (max < +submission.submissionValue)
            max = +submission.submissionValue;

          sum += +submission.submissionValue;
          counter++;
        });

        formField.formFieldScore = sum / counter;
        formField.formSubmissionFieldMax = max;
        formField.formSubmissionFieldMin = min;
        formField.avgFormFieldScore = overallSum / overallCounter;

        const vals = formField.raw[0].options.map(({value}: any) => +value);
        formField.formFieldMax = Math.max(...vals);
        formField.formFieldMin = Math.min(...vals);
        formField.aggregatedValues = formField.raw[0].jobRequirementId;

        formField.overallFormSubmissionFieldMax = overallMax;
        formField.overallFormSubmissionFieldMin = overallMin;
      } else {
        submissions.forEach((submission: any) => {
          if (submission.applicantId !== applicantId) return;
          push('aggregatedValues', submission.submissionValue, formField);
        });
      }

      formField.formFieldId = formFieldId;
      formField.jobRequirementId = formField.raw[0].jobRequirementId;
      formField.rowIndex = formField.raw[0].rowIndex;
      formField.intent = formField.raw[0].intent;
      formField.label = formField.raw[0].label;

      delete formField.raw;
    });
  });

  console.log(util.inspect(separated, {showHidden: false, depth: null}));

  // do calculations

  // bum
  return separated;
};

function push(path: string, value: any, obj: any) {
  const pList = path.split('.');
  for (var i = 0; i < pList.length - 1; i++) {
    var elem = pList[i];
    if (!obj[elem]) obj[elem] = {};
    obj = obj[elem];
  }
  if (!obj[pList[pList.length - 1]]) obj[pList[pList.length - 1]] = [value];
  else obj[pList[pList.length - 1]].push(value);
}

/*

ÜBERLEGUNGEN:
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

/*
ALGORITHM
===================
1) split up current data in

{
  overall: {
    [formId]: {
      [formFieldId]: [all values for this formField]
    }
  },
  specific: {
    [applicantId]: {
      [formId]: {
        [formFieldId]: [all values for this formField and this applicant] 
      }
    }
  }
}
*/
