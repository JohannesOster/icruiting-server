export type TRanking = Array<TRankingRow>;

export type TRankingRow = {
  applicantId: string;
  score: number;
  standardDeviation: number;
  submissions: Array<TSubmission>;
};

export type TSubmission = Array<{
  formFieldId: string;
  jobRequirementId?: string;
  value: number | string;
  intent: EFormItemIntent;
  label: string;
}>;

export enum EFormItemIntent {
  sumUp = 'sum_up',
  aggregate = 'aggregate',
  countDistinct = 'count_distinct',
}

export type KeyVal = {[key: string]: number};

export type TRankingResultObject = {
  [formFieldId: string]: {
    label: string;
    intent: EFormItemIntent;
    value: number | Array<string> | {[key: string]: number}; // sumUp, aggregate, countDistinc
  };
};
