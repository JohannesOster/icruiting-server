import _ from 'lodash';
import {ReportPrepareRow} from 'infrastructure/db/repos/formSubmissions/types';
import {Forms, FormFields, Submissions} from './types';

// Separate informations about formFields from submission data
export const filterFormData = (rows: ReportPrepareRow[]) => {
  const formFields = rows.reduce((acc, curr) => {
    if (!!acc[curr.formId]?.[curr.formFieldId]) return acc;
    const {intent, options, rowIndex, label, jobRequirementId} = curr;
    const entry = {intent, options, rowIndex, label, jobRequirementId};
    _.set(acc, `${curr.formId}.${curr.formFieldId}`, entry);
    return acc;
  }, {} as FormFields);

  const forms = rows.reduce(
    (acc, {formId, formTitle, formCategory, replicaOf}) => {
      if (!!acc[formId]) return acc;
      _.set(acc, `${formId}`, {formTitle, formCategory, replicaOf});
      return acc;
    },
    {} as Forms,
  );

  return [forms, formFields] as const;
};

// transform submission rows into nested object
export const reduceSubmissions = (rows: ReportPrepareRow[]) => {
  return rows.reduce((acc, curr) => {
    const {applicantId, submitterId, formId, formFieldId} = curr;
    const path = `${applicantId}.${submitterId}.${formId}.${formFieldId}`;
    _.set(acc, path, curr.submissionValue);
    return acc;
  }, {} as Submissions);
};
