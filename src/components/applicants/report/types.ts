import {Row} from '../database';
import {EFormCategory} from 'db/repos/forms';

export type FormData = {
  [formId: string]: {
    [formFieldId: string]: {
      intent: FormFieldIntent;
      options?: {label: string; value: string}[];
      rowIndex: number;
      label: string;
      jobRequirementId: string;
    };
  };
};

export type Data = {
  [applicantId: string]: {
    [formSubmissionId: string]: {
      [formId: string]: {
        [formFieldId: string]: Row;
      };
    };
  };
};

export type FormFieldScores = {
  [applicantId: string]: {
    [formId: string]: {
      [formFieldId: string]: number;
    };
  };
};

export type OverallAvgFormFieldScore = {
  [formId: string]: {
    [formFieldId: string]: number;
  };
};

export type FormScores = {
  [applicantId: string]: {
    [formId: string]: number;
  };
};

export type FormFieldIntent = 'sum_up' | 'counst_distinct' | 'aggregate';

export type BaseReport = {
  rank: number;
  formCategory: EFormCategory;
  formCategoryScore: number;
  overallAvgFormCategoryScore: number;
  overallStdDevFormCategoryScore: number;
  formResults: {
    formId: string;
    formTitle: string;
    formScore: number;
    avgFormScore: number;
    possibleFormMax: number;
    formFieldScores: {
      formFieldId: string;
      jobRequirementId: string;
      rowIndex: number;
      intent: FormFieldIntent;
      label: string;
      aggregatedValues: string[];
      formFieldScore: number;
      avgFormFieldScore: number;
      overallFormFieldMax: number;
      overallFormFieldMin: number;
      possibleFormFieldMax: number;
      possibleFormFieldMin: number;
      /** Achieved max for this field */
      // formSubmissionFieldMax: number;
      // /** Achieved min for this field */
      // formSubmissionFieldMin: number;
    }[];
  }[];
  // submissionsCount
  // jobRequirementResults: {
  //   jobRequirementId: string;
  //   jobRequirementScore: number;
  //   avgJobRequirementScore: number;
  //   requirementLabel: string;
  //   minValue: number;
  // }[];
};
