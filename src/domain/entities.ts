export type Tenant = {
  tenantId: string;
  tenantName: string;
  stripeCustomerId?: string;
  theme?: string;
  createdAt: string;
};

export type User = {
  tenantId: string;
  userId: string;
  email: string;
  userRole: 'admin' | 'member';
};

export type JobRequirement = {
  jobRequirementId: string;
  requirementLabel: string;
  minValue?: string;
};

export type Job = {
  tenantId: string;
  jobId: string;
  jobTitle: string;
  jobRequirements: JobRequirement[];
};

export type FormField = {
  formFieldId: string;
  rowIndex: number;
  component: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  options?: {label: string; value: string}[];
  editable?: boolean;
  deletable?: boolean;
  jobRequirementId?: string;
};

export type FormCategory = 'application' | 'screening' | 'assessment';
export type Form = {
  tenantId: string;
  jobId: string;
  formId: string;
  formCategory: FormCategory;
  formTitle?: string;
  formFields: FormField[];
};

export type FormSubmission = {
  tenantId: string;
  formId: string;
  submitterId: string;
  applicantId: string;
  submission: {[formFieldId: string]: string};
};

export type Applicant = {
  tenantId: string;
  jobId: string;
  applicantId: string;
  attributes: {key: string; value: string}[];
  files: {key: string; value: string}[];
};
