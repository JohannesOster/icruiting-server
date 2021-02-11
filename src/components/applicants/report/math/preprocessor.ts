import _ from 'lodash';
import {Row} from '../../database';
import {FormData, FormSubmissionData} from './types';

// Separate informations about formfields from submission data
export const filterFormData = (rows: Row[]) => {
  return rows.reduce((acc, curr) => {
    if (!!acc[curr.formId]?.[curr.formFieldId]) return acc;
    const {intent, options, rowIndex, label, jobRequirementId} = curr;
    const entry = {intent, options, rowIndex, label, jobRequirementId};
    _.set(acc, `${curr.formId}.${curr.formFieldId}`, entry);
    return acc;
  }, {} as FormData);
};

// transform submission rows into nested object
export const reduceSubmissions = (rows: Row[]) => {
  return rows.reduce((acc, curr) => {
    const {applicantId, submitterId, formId, formFieldId} = curr;
    const path = `${applicantId}.${submitterId}.${formId}.${formFieldId}`;
    _.set(acc, path, curr.submissionValue);
    return acc;
  }, {} as FormSubmissionData);
};
