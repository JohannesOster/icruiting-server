import _ from 'lodash';
import {Calculator} from './calculator';

type Submissions = {
  [submitterId: string]: {
    [applicantId: string]: {[formId: string]: {[formFieldId: string]: string}};
  };
};
type Forms = {
  [formId: string]: {
    [formFieldId: string]: {
      intent: string; //'sum_up' | 'aggegrate' | 'count_distinct';
      options?: {label: string; value: string}[];
      rowIndex: number;
      label: string;
      jobRequirementId?: string;
    };
  };
};

type Score = {mean: number; stdDev: number};
type Result = {
  formFieldScores: {
    [applicantId: string]: {[formId: string]: {[formFieldId: string]: Score}};
  };
  formScores: {[applicantId: string]: {[formId: string]: Score}};
  formCategoryScores: {[applicantId: string]: number};
  aggregates: {
    [applicantId: string]: {
      [formId: string]: {[formFieldId: string]: string[]};
    };
  };
};
export const ReportBuilder = (forms: Forms, submissions: Submissions) => {
  const calc = Calculator();
  const applicantIds = Object.keys(submissions);
  let counter = 0;

  const result = Object.entries(forms).reduce((acc, [formId, formFields]) => {
    Object.entries(formFields).forEach(([formFieldId, formField]) => {
      if (formField.intent !== 'sum_up') {
        applicantIds.forEach((applicantId) => {
          counter++;
          const submission = Object.values(submissions[applicantId]).find(
            (val) => !!val[formId],
          );
          if (!submission) return;

          const aggregated = Object.values(submissions[applicantId])
            .map((subs) => _.get(subs, `${formId}.${formFieldId}`) as any)
            .filter((val) => !!val);

          let path = `aggregates.${applicantId}.${formId}.${formFieldId}`;
          _.set(acc, path, aggregated);
        });
        return;
      }

      applicantIds.forEach((applicantId) => {
        counter++;
        const submission = Object.values(submissions[applicantId]).find(
          (val) => !!val[formId],
        );
        if (!submission) return;
        let path = `${formId}.${formFieldId}`;
        const [mean, stdDev] = calc.deepScore(submissions[applicantId], path);
        path = `${applicantId}.${path}`;
        _.set(acc, `formFieldScores.${path}`, {mean, stdDev});
      });

      applicantIds.forEach((applicantId) => {
        counter++;
        const submission = Object.values(submissions[applicantId]).find(
          (val) => !!val[formId],
        );
        if (!submission) return;

        const formSubmissionScores = Object.values(submissions[applicantId])
          .map((submissions) => {
            if (!submissions[formId]) return;
            const submissionValues = Object.values(submissions[formId])
              .map((val) => +val)
              .filter((val) => !isNaN(val));
            if (!submissionValues.length) return;

            return calc.sum(submissionValues);
          })
          .filter((val) => !!val) as number[];
        if (formSubmissionScores.length) {
          const [formMean, formStdDev] = calc.score(formSubmissionScores);

          _.set(acc, `formScores.${applicantId}.${formId}`, {
            mean: formMean,
            stdDev: formStdDev,
          });
        }
      });

      applicantIds.forEach((applicantId) => {
        counter++;
        const formScores = Object.values(acc.formScores[applicantId]) as any;
        const [formCategoryMean] = calc.deepScore(formScores, 'mean');
        _.set(acc, `formCategoryScores.${applicantId}`, formCategoryMean);
      });
    });
    return acc;
  }, {} as Result);

  // console.log('Schleifendurchgänge', counter);

  return result;
};
