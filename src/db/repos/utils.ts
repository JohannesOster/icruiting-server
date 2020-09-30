import {round} from '../../math';

export type FormFieldIntent = 'sum_up' | 'aggregate' | 'count_distinct';

export type KeyVal<T> = {
  [key: string]: T;
};

export type TRankingRowDb = {
  applicantId: string;
  rank: string;
  score: string;
  standardDeviation: string;
  submissionsCount: string;
  submissions: Array<
    Array<{
      formFieldId: string;
      jobRequirementLabel: string | null;
      value: string;
      intent: FormFieldIntent;
      label: string;
    }>
  >;
};

export type TRankingResultVal = {
  label: string;
  intent: FormFieldIntent;
  value: number | Array<string> | {[key: string]: number}; // sumUp, aggregate, countDistinc
};

export const buildReport = (row: TRankingRowDb) => {
  const reqProfile = {} as KeyVal<{counter: number; sum: number}>;
  const initialValues = (key: FormFieldIntent) =>
    ({
      sum_up: 0,
      aggregate: [],
      count_distinct: {},
    }[key]);

  const result = row.submissions.reduce((acc, submission) => {
    submission.forEach(
      ({formFieldId, intent, value, label, jobRequirementLabel}) => {
        if (!value) return acc;
        if (!acc[formFieldId]) {
          acc[formFieldId] = {label, intent, value: initialValues(intent)};
        }

        switch (intent) {
          case 'sum_up':
            (acc[formFieldId].value as number) += +value;
            if (jobRequirementLabel) {
              if (reqProfile[jobRequirementLabel]?.sum === undefined) {
                reqProfile[jobRequirementLabel] = {counter: 1, sum: +value};
                break;
              }
              reqProfile[jobRequirementLabel].sum += +value;
              reqProfile[jobRequirementLabel].counter += 1;
            }
            break;
          case 'aggregate':
            (acc[formFieldId].value as string[]).push(value);
            break;
          case 'count_distinct':
            const currVal = (acc[formFieldId].value as KeyVal<number>)[value];
            (acc[formFieldId].value as KeyVal<number>)[value] =
              (currVal || 0) + 1;
            break;
        }
      },
    );

    return acc;
  }, {} as KeyVal<TRankingResultVal>);

  // Convert sum up values to mean
  Object.entries(result).forEach(([key, val]) => {
    if (val.intent !== 'sum_up') return;
    const mean = round(+val.value / +row.submissionsCount);
    result[key] = {...val, value: mean};
  });

  // Convert reqProfile values to means
  const entries = Object.entries(reqProfile);
  const jobRequirementsResult = entries.reduce((acc, [key, {counter, sum}]) => {
    acc[key] = round(sum / counter);
    return acc;
  }, {} as KeyVal<number>);

  return {...row, result, jobRequirementsResult};
};
