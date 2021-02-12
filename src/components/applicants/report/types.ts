import {EFormCategory} from 'db/repos/forms';

export type Submissions = {
  [submitterId: string]: {
    [applicantId: string]: {[formId: string]: {[formFieldId: string]: string}};
  };
};

export type Forms = {
  [formId: string]: {
    [formFieldId: string]: {
      intent: string; //'sum_up' | 'aggegrate' | 'count_distinct';
      options?: {label: string; value: string}[];
      rowIndex: number;
      label: string;
      jobRequirementId?: string;
    };
  };
};

type Score = {mean: number; stdDev: number};
export type ReportBuilderReturnType = {
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
  jobRequirementResults: {
    jobRequirementId: string;
    jobRequirementScore: number;
    requirementLabel: string;
    minValue?: number;
  }[];
};
