import _, {max, min, sum} from 'lodash';
import {ReportPrepareRow} from 'modules/formSubmissions/infrastructure/repositories/formSubmissions/types';
import {Forms, FormFields, Submissions} from './types';

// Separate informations about formFields from submission data
export const filterFormData = (rows: ReportPrepareRow[]) => {
  const [formFields, forms] = rows.reduce(
    (acc, curr) => {
      // form Info
      if (!acc[1][curr.formId]) {
        const {formId, formTitle, formCategory, replicaOf} = curr;
        _.set(acc[1], `${formId}`, {formTitle, formCategory, replicaOf});
      }

      // min / max scores

      if (!!acc[0][curr.formId]?.[curr.formFieldId]) return acc;
      const {intent, options, rowIndex, label, jobRequirementId} = curr;
      const entry = {intent, options, rowIndex, label, jobRequirementId};
      _.set(acc[0], `${curr.formId}.${curr.formFieldId}`, entry);
      return acc;
    },
    [{}, {}] as [FormFields, Forms],
  );

  Object.entries(forms).forEach(([formId, form]) => {
    const _formFields = Object.values(formFields[formId]);
    // the min and max for each field
    const minMaxes = _formFields
      .map(({options, intent}) => {
        if (!(options && intent === 'sum_up')) return null;
        const values = Object.values(options).map(({value}) => +value);
        return {min: min(values), max: max(values)};
      })
      .filter((value) => value) as {min: number; max: number}[];

    form.possibleMinFormScore = sum(minMaxes.map(({min}) => min));
    form.possibleMaxFormScore = sum(minMaxes.map(({max}) => max));
  });

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
