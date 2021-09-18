import {FormFieldIntent} from 'modules/forms/domain';

export type Submissions = {
  [submitterId: string]: {
    [applicantId: string]: {[formId: string]: {[formFieldId: string]: string}};
  };
};

export type FormFields = {
  [formId: string]: {
    [formFieldId: string]: {
      intent: FormFieldIntent;
      options?: {label: string; value: string}[];
      rowIndex: number;
      label: string;
      jobRequirementId?: string;
    };
  };
};

export type Forms = {
  [formId: string]: {
    formTitle: string;
    formCategory: string;
    possibleMaxFormScore: number;
    possibleMinFormScore: number;
    replicaOf?: string;
  };
};

export type Score = {mean: number; stdDev?: number}; // formScore might not have a stdDev
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
  countDistinct: {
    [applicantId: string]: {
      [formId: string]: {[formfieldId: string]: {[label: string]: number}};
    };
  };
  jobRequirements: {
    [applicantId: string]: {[jobRequirementId: string]: number};
  };
};
