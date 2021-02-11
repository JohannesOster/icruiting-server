import {FormFieldIntent} from '../types';

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

export type FormSubmissionData = {
  [applicantId: string]: {
    [submitterId: string]: {
      [formId: string]: {
        [formFieldId: string]: string;
      };
    };
  };
};
