import {BaseError, catchAsync} from 'errorHandling';
import {
  dbSelectFormSubmission,
  dbInsertFormSubmission,
  dbUpdateFormSubmission,
} from './database';

export const getFormSubmission = catchAsync(async (req, res) => {
  const {userId, tenantId} = res.locals.user;
  const {formId, applicantId} = req.params;
  const params = {formId, applicantId, submitterId: userId, tenantId};
  const resp = await dbSelectFormSubmission(params);
  if (!resp) throw new BaseError(404, 'Not Found');
  res.status(200).json(resp);
});

export const createFormSubmission = catchAsync(async (req, res) => {
  const {userId, tenantId} = res.locals.user;
  const params = {...req.body, submitterId: userId, tenantId};
  const resp = await dbInsertFormSubmission(params);
  res.status(201).json(resp);
});

export const updateFormSubmission = catchAsync(async (req, res) => {
  const {tenantId} = res.locals.user;
  const {formSubmissionId} = req.params;
  const {submission} = req.body;
  const params = {submission, formSubmissionId, tenantId};
  const resp = await dbUpdateFormSubmission(params);
  res.status(200).json(resp);
});
