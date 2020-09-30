import {random} from 'faker';
import {mean, standardDeviation, round} from '../math';
import {FormFieldIntent} from './repos/utils';

// ! Note this factory func does not represent the real structure of a form field
//   it is just use as helper to reduce code duplication.
//   Normally the formField does not have a jobRequirementLabel, but a jobRequirementId
export const createFormField = (
  intent: FormFieldIntent,
  jobRequirementLabel: string | null = null,
) => ({
  formFieldId: random.uuid(),
  intent,
  label: random.words(),
  jobRequirementLabel,
});

export const createSubmission = (
  formFields: ReturnType<typeof createFormField>[],
) => {
  return formFields.map((formField) => ({
    formFieldId: formField.formFieldId,
    jobRequirementLabel: formField.jobRequirementLabel,
    intent: formField.intent,
    label: formField.label,
    value: random.number({min: 0, max: 4}).toString(),
  }));
};

export const createRankingRow = (
  submissions: ReturnType<typeof createSubmission>[],
  rank = Math.round(random.number({min: 0, max: 100})).toString(),
) => {
  const subTotals: number[] = [];
  submissions.forEach((submission) => {
    const subTotal = submission.reduce((sum, {intent, value}) => {
      if (intent !== 'sum_up') return sum;
      return sum + +value;
    }, 0);
    subTotals.push(subTotal);
  });

  return {
    applicantId: random.uuid(),
    rank,
    score: mean(subTotals).toString(),
    standardDeviation: round(standardDeviation(subTotals)).toString(),
    submissionsCount: submissions.length.toString(),
    submissions,
  };
};
