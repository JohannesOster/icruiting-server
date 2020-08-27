import {TSubmission} from './types';

export const sumUpjobRequirementsScore = (submissions: Array<TSubmission>) => {
  return submissions.reduce((acc, submission) => {
    submission.forEach((submissionField) => {
      const val = submissionField.value;
      const key = submissionField.job_requirement_id;
      if (!key) return acc;
      acc[key] = acc[key] ? acc[key] + val : val;
    });

    return acc;
  }, {} as any);
};
