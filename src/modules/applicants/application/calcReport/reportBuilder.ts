import _ from 'lodash';
import * as calc from './calculator';
import {Submissions, ReportBuilderReturnType, FormFields} from './types';

export const ReportBuilder = (
  formFields: FormFields,
  submissions: Submissions,
) => {
  const applicantIds = Object.keys(submissions);

  const jobRequirements: {
    [jobRequirementId: string]: {[formId: string]: string}[];
  } = {};

  const aggregateFormSubmissionFields = (
    applicantId: string,
    formId: string,
    formFieldId: string,
  ) => {
    const forms = submissions[applicantId];
    const submission = Object.values(forms).find((val) => !!val[formId]);
    if (!submission) return;

    const aggregated: string[] = Object.values(forms)
      .map((subs) => _.get(subs, `${formId}.${formFieldId}`) as any)
      .filter((val) => !!val);

    return aggregated;
  };

  const result = Object.entries(formFields).reduce(
    (acc, [formId, formFields]) => {
      Object.entries(formFields).forEach(([formFieldId, formField]) => {
        if (formField.intent === 'aggregate') {
          applicantIds.forEach((applicantId) => {
            const aggregated = aggregateFormSubmissionFields(
              applicantId,
              formId,
              formFieldId,
            );
            if (!aggregated) return;

            const path = `aggregates.${applicantId}.${formId}.${formFieldId}`;
            _.set(acc, path, aggregated);
          });
          return;
        }

        if (formField.intent === 'count_distinct') {
          applicantIds.forEach((applicantId) => {
            const aggregated = aggregateFormSubmissionFields(
              applicantId,
              formId,
              formFieldId,
            );
            if (!aggregated) return;

            const options = formField.options?.reduce((acc, curr) => {
              acc[curr.value] = curr.label;
              return acc;
            }, {} as any);

            const counter = aggregated.reduce((acc, curr) => {
              const key = options[curr];
              if (!acc[key]) acc[key] = 0;
              ++acc[key];
              return acc;
            }, {} as any);

            const path = `countDistinct.${applicantId}.${formId}.${formFieldId}`;
            _.set(acc, path, counter);
          });
          return;
        }

        applicantIds.forEach((applicantId) => {
          const submission = Object.values(submissions[applicantId]).find(
            (val) => !!val[formId],
          );
          if (!submission) return;
          let path = `${formId}.${formFieldId}`;

          // check if there are submissions for this field
          const data = Object.values(submissions[applicantId])
            .map((sub) => parseInt(_.get(sub, path, '') as string, 10))
            .filter((val) => !isNaN(val));
          if (!data.length) return;

          const [mean, stdDev] = calc.score(data);
          path = `${applicantId}.${path}`;
          _.set(acc, `formFieldScores.${path}`, {mean, stdDev});
        });

        if (!formField.jobRequirementId) return;
        if (!jobRequirements[formField.jobRequirementId]) {
          jobRequirements[formField.jobRequirementId] = [];
        }
        const kv = {[formId]: formFieldId};
        jobRequirements[formField.jobRequirementId].push(kv);
      });

      if (!acc.formFieldScores) return acc;

      Object.entries(acc.formFieldScores).forEach(([applicantId, forms]) => {
        Object.entries(forms).forEach(([formId, formFields]) => {
          const scores = Object.values(formFields).map(({mean}) => mean);
          const formScore = calc.sum(scores);
          _.set(acc, `formScores.${applicantId}.${formId}`, {mean: formScore});
        });
      });

      return acc;
    },
    {} as ReportBuilderReturnType,
  );

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
