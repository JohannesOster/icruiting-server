import {BaseError, catchAsync} from 'errorHandling';
import {
  dbSelectFormSubmission,
  dbInsertFormSubmission,
  dbUpdateFormSubmission,
} from './database';

export const getFormSubmission = catchAsync(async (req, res) => {
  const {user_id, tenant_id} = res.locals.user;
  const {form_id, applicant_id} = req.params;
  const params = {form_id, applicant_id, submitter_id: user_id, tenant_id};
  const resp = await dbSelectFormSubmission(params);
  if (!resp) throw new BaseError(404, 'Not Found');
  res.status(200).json(resp);
});

export const createFormSubmission = catchAsync(async (req, res) => {
  const {user_id, tenant_id} = res.locals.user;
  const params = {...req.body, submitter_id: user_id, tenant_id};
  const resp = await dbInsertFormSubmission(params);
  res.status(201).json(resp);
});

export const updateFormSubmission = catchAsync(async (req, res) => {
  const {tenant_id} = res.locals.user;
  const {form_submission_id} = req.params;
  const {submission} = req.body;
  const params = {submission, form_submission_id, tenant_id};
  const resp = await dbUpdateFormSubmission(params);
  res.status(200).json(resp);
});
