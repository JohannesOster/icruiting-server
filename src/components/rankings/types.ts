export type TRanking = Array<TRankingRow>;

export type TRankingRow = {
  applicant_id: string;
  score: number;
  standard_deviation: number;
  submissions: Array<TSubmission>;
};

export type TSubmission = Array<{
  form_item_id: string;
  job_requirement_id?: string;
  value: number;
}>;

export type TScreeningRankingRow = {
  applicant_id: string;
  score: number;
  standard_deviation: number;
  submissions: Array<TScreeningRankingSubmission>;
};

export enum EFormItemIntent {
  sumUp = 'sum_up',
  aggregate = 'aggregate',
  countDistinct = 'count_distinct',
}

export type KeyVal = {[key: string]: number};

export type TScreeningRankingSubmission = Array<{
  form_item_id: string;
  label: string;
  intent: EFormItemIntent;
  value: number | string;
}>;

export type TScreeningResultObject = {
  [form_item_id: string]: {
    label: string;
    intent: EFormItemIntent;
    value: number | Array<string> | {[key: string]: number}; // sumUp, aggregate, countDistinc
  };
};
