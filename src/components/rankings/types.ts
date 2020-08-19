export type TRanking = Array<TRankingRow>;

export type TRankingRow = {
  applicant_id: string;
  score: number;
  standard_deviation: number;
  comments: Array<string>;
  submissions_count: number;
  submissions: Array<TSubmission>;
};

export type TSubmission = Array<{
  form_item_id: string;
  job_requirement_id?: string;
  weighing: number;
  value: number;
}>;
