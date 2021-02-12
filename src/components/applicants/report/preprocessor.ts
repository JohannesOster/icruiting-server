import _ from 'lodash';
import {ReportPrepareRow} from 'db/repos/formSubmissions/types';
import {Forms, Submissions} from './types';

// Separate informations about formfields from submission data
export const filterFormData = (rows: ReportPrepareRow[]) => {
  const formFields = rows.reduce((acc, curr) => {
    if (!!acc[curr.formId]?.[curr.formFieldId]) return acc;
    const {intent, options, rowIndex, label, jobRequirementId} = curr;
    const entry = {intent, options, rowIndex, label, jobRequirementId};
    _.set(acc, `${curr.formId}.${curr.formFieldId}`, entry);
    return acc;
  }, {} as Forms);

  const forms = rows.reduce((acc, {formId, formTitle}) => {
    if (!!acc[formId]) return acc;
    _.set(acc, `${formId}.formTitle`, formTitle);
    return acc;
  }, {} as {[formId: string]: {formTitle: string}});

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
