import {round} from '../math';

export type FormFieldIntent = 'sum_up' | 'aggregate' | 'count_distinct';

export type KeyValuePair<T> = {
  [key: string]: T;
};

export type FormSubmission = {
  formFieldId: string;
  maxValue?: string;
  jobRequirementLabel: string | null;
  value: string;
  intent: FormFieldIntent;
  label: string;
}[];

export type TRankingRowDb = {
  applicantId: string;
  rank: string;
  score: string;
  standardDeviation: string;
  submissionsCount: string;
  submissions: FormSubmission[];
  normalization?: {
    jobRequirementLabel: string;
    mean: string;
    values: string[];
  }[];
};

type TRankingResultVal = {
  label: string;
  intent: FormFieldIntent;
  value: number | string[] | {[key: string]: number}; // sumUp, aggregate, countDistinc
};

export const buildReport = (row: TRankingRowDb) => {
  const [result, reqProfile] = reduceFormSubmissions(row.submissions);

  // Convert sum up values to mean and percentage of maxValue
  Object.entries(result).forEach(([key, val]) => {
    if (val.intent !== 'sum_up') return;
    const mean = round(+val.value / +row.submissionsCount, 4);
    result[key] = {...val, value: mean};
  });

  // Convert reqProfile values to means
  const entries = Object.entries(reqProfile);
  const jobRequirementsResult = entries.reduce((acc, [key, {counter, sum}]) => {
    acc[key] = round(sum / counter);
    if (!row.normalization) return acc;

    const normalizer = row.normalization.find(
      ({jobRequirementLabel}) => jobRequirementLabel === key,
    );
    if (!normalizer) throw new Error('Missing normalization for ' + key);

    acc[key] = acc[key] / +normalizer.mean;

    return acc;
  }, {} as KeyValuePair<number>);

  return {...row, result, jobRequirementsResult};
};

export const reduceFormSubmissions = (formSubmissions: FormSubmission[]) => {
  const reqProfile = {} as KeyValuePair<{counter: number; sum: number}>;
  const initialValues = (key: FormFieldIntent) =>
    ({
      sum_up: 0,
      aggregate: [],
      count_distinct: {},
    }[key]);

  const result = formSubmissions.reduce((acc, submissionFields) => {
    submissionFields.forEach(
      ({formFieldId, intent, value, label, jobRequirementLabel, maxValue}) => {
        if (!value) return acc;
        if (!acc[formFieldId]) {
          acc[formFieldId] = {label, intent, value: initialValues(intent)};
        }

        switch (intent) {
          case 'sum_up':
            (acc[formFieldId].value as number) += +value / +(maxValue || 1); // value as percentage of max
            if (!jobRequirementLabel) break;
            // if this is the first field for the given job_requirement initialize a result object
            if (reqProfile[jobRequirementLabel]?.sum === undefined) {
              reqProfile[jobRequirementLabel] = {counter: 1, sum: +value};
              break;
            }
            reqProfile[jobRequirementLabel].sum += +value; // for requirements value is added as is not as a percentage
            reqProfile[jobRequirementLabel].counter += 1;
            break;
          case 'aggregate':
            (acc[formFieldId].value as string[]).push(value);
            break;
          case 'count_distinct':
            /** QUICK FIX to exclude unchecked values, which procue the string "false" */
            if (value === 'false') break;
            const currVal = (acc[formFieldId].value as KeyValuePair<number>)[
              value
            ];
            (acc[formFieldId].value as KeyValuePair<number>)[value] =
              (currVal || 0) + 1;
            break;
        }
      },
    );

    return acc;
  }, {} as KeyValuePair<TRankingResultVal>);

  return [result, reqProfile];
};
