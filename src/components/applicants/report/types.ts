import {EFormCategory} from 'db/repos/forms';

export type FormFieldIntent = 'sum_up' | 'counst_distinct' | 'aggregate';

export type BaseReport = {
  rank: number;
  formCategory: EFormCategory;
  formCategoryScore: number;
  formResults: {
    formId: string;
    formTitle: string;
    formScore: number;
    stdDevFormScore: number;
    formFieldScores: {
      formFieldId: string;
      jobRequirementId: string;
      rowIndex: number;
      intent: FormFieldIntent;
      label: string;
      aggregatedValues: string[];
      formFieldScore: number;
      stdDevFormFieldScores: number;
    }[];
  }[];
};
