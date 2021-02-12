import _ from 'lodash';
import {Calculator} from './calculator';
import {Forms, Submissions} from './types';

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
  jobRequirements: {
    [applicantId: string]: {[jobRequirementId: string]: number};
  };
};
export const ReportBuilder = (forms: Forms, submissions: Submissions) => {
  const calc = Calculator();
  const applicantIds = Object.keys(submissions);

  const jobRequirements: {
    [jobRequirementId: string]: {[formId: string]: string}[];
  } = {};

  const result = Object.entries(forms).reduce((acc, [formId, formFields]) => {
    Object.entries(formFields).forEach(([formFieldId, formField]) => {
      if (formField.intent !== 'sum_up') {
        applicantIds.forEach((applicantId) => {
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

      // join jobRequirement specific fields
      if (formField.jobRequirementId) {
        if (!jobRequirements[formField.jobRequirementId]) {
          jobRequirements[formField.jobRequirementId] = [
            {[formId]: formFieldId},
          ];
        } else {
          jobRequirements[formField.jobRequirementId].push({
            [formId]: formFieldId,
          });
        }
      }
      applicantIds.forEach((applicantId) => {
        const submission = Object.values(submissions[applicantId]).find(
          (val) => !!val[formId],
        );
        if (!submission) return;
        let path = `${formId}.${formFieldId}`;
        const [mean, stdDev] = calc.deepScore(submissions[applicantId], path);
        path = `${applicantId}.${path}`;
        _.set(acc, `formFieldScores.${path}`, {mean, stdDev});
      });
    });

    applicantIds.forEach((applicantId) => {
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

    return acc;
  }, {} as Result);

  applicantIds.forEach((applicantId) => {
    if (!result.formScores) return;
    if (!result.formScores[applicantId]) return;
    const formScores = Object.values(result.formScores[applicantId]) as any;
    const [formCategoryMean] = calc.deepScore(formScores, 'mean');
    _.set(result, `formCategoryScores.${applicantId}`, formCategoryMean);
  });

  Object.entries(jobRequirements).forEach(([jobRequirementId, formFields]) => {
    applicantIds.reduce((acc, applicantId) => {
      const scores = formFields
        .map((formFieldKV) => {
          const formId = Object.keys(formFieldKV)[0];
          const formFieldId = formFieldKV[formId];

          return _.get(
            result,
            `formFieldScores.${applicantId}.${formId}.${formFieldId}.mean`,
          );
        })
        .filter((val) => val !== undefined);

      let score = 0; // score defaults to zero
      if (scores.length) score = calc.mean(scores);

      const path = `jobRequirements.${applicantId}.${jobRequirementId}`;
      _.set(result, path, score);

      return acc;
    }, {} as any);
  });

  return result;
};
