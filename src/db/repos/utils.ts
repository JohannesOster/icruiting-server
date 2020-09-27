import {round} from '../utils';

enum EFormItemIntent {
  sumUp = 'sum_up',
  aggregate = 'aggregate',
  countDistinct = 'count_distinct',
}

type KeyVal<T> = {
  [key: string]: T;
};

type TRankingRowDb = {
  applicantId: string;
  rank: string;
  score: string;
  standardDeviation: string;
  submissionsCount: string;
  submissions: Array<
    Array<{
      formFieldId: string;
      jobRequirementLabel?: string;
      value: string;
      intent: EFormItemIntent;
      label: string;
    }>
  >;
};

type TRankingResultVal = {
  label: string;
  intent: EFormItemIntent;
  value: number | Array<string> | {[key: string]: number}; // sumUp, aggregate, countDistinc
};

export const buildReport = (row: TRankingRowDb) => {
  const reqProfile = {} as KeyVal<number>;
  const initialValues = (key: EFormItemIntent) =>
    ({
      [EFormItemIntent.sumUp]: 0,
      [EFormItemIntent.aggregate]: [],
      [EFormItemIntent.countDistinct]: {},
    }[key]);

  const result = row.submissions.reduce((acc, submission) => {
    submission.forEach(
      ({formFieldId, intent, value, label, jobRequirementLabel}) => {
        if (!value) return acc;
        if (!acc[formFieldId]) {
          acc[formFieldId] = {label, intent, value: initialValues(intent)};
        }

        switch (intent) {
          case EFormItemIntent.sumUp:
            (acc[formFieldId].value as number) += +value;
            if (jobRequirementLabel) {
              const newVal = (reqProfile[jobRequirementLabel] || 0) + +value;
              reqProfile[jobRequirementLabel] = newVal;
            }
            break;
          case EFormItemIntent.aggregate:
            (acc[formFieldId].value as string[]).push(value);
            break;
          case EFormItemIntent.countDistinct:
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
    if (val.intent !== EFormItemIntent.sumUp) return;
    const average = round(+val.value / +row.submissionsCount);
    result[key] = {...val, value: average};
  });

  return {...row, result, jobRequirementsResult: reqProfile};
};
