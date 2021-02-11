import {EFormCategory} from 'db/repos/forms';

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
  overallFormCategoryMax: number;
  overallFormCategoryMin: number;
  possibleFormCategoryMax: number;
  possibleFormCategoryMin: number;
  formResults: {
    formId: string;
    formTitle: string;
    formScore: number;
    stdDevFormScore: number;
    overallAvgFormScore: number;
    overallStdDevFormScore: number;
    overallAvgStdDevFormScore: number;
    overallFormMin: number;
    overallFormMax: number;
    possibleFormMin: number;
    possibleFormMax: number;
    formFieldScores: {
      formFieldId: string;
      jobRequirementId: string;
      rowIndex: number;
      intent: FormFieldIntent;
      label: string;
      aggregatedValues: string[];
      formFieldScore: number;
      stdDevFormFieldScores: number;
      overallAvgFormFieldScore: number;
      overallStdDevFormFieldScore: number;
      overallAvgStdDevFormFieldScore: number;
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
