import {FormCategory, FormFieldIntent} from 'domain/entities';

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
    replicaOf?: string;
  };
};

export type Score = {mean: number; stdDev: number};
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

type ReportFormFieldResult = {
  formFieldId: string;
  jobRequirementId?: string;
  rowIndex: number;
  intent: FormFieldIntent;
  label: string;
  aggregatedValues: string[];
  countDistinct?: {[key: string]: number};
  formFieldScore: number;
  stdDevFormFieldScores: number;
};

export type Report = {
  rank: number;
  formCategory: FormCategory;
  formCategoryScore: number;
  formResults: {
    formId: string;
    formTitle: string;
    formScore: number;
    stdDevFormScore: number;
    formFieldScores: ReportFormFieldResult[];
    replicas?: {
      formId: string;
      formTitle: string;
      formScore: number;
      stdDevFormScore: number;
      formFieldScores: ReportFormFieldResult[];
    }[];
  }[];
  jobRequirementResults: {
    jobRequirementId: string;
    jobRequirementScore: number;
    requirementLabel: string;
    minValue?: number;
  }[];
};
